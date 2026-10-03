const bcrypt = require("bcryptjs");

const { User, RefreshToken, RegistrationOtp } = require("../models");

const AppError = require("../utils/AppError");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const crypto = require("crypto");
const { sendRegistrationCode } = require("./email.service");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const otpHash = (email, code) =>
  crypto
    .createHmac(
      "sha256",
      process.env.OTP_HASH_SECRET || process.env.JWT_ACCESS_SECRET,
    )
    .update(`${email}:${code}`)
    .digest("hex");

const requestRegistrationOtp = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const previous = await RegistrationOtp.findOne({ email: normalizedEmail });
  if (previous && Date.now() - previous.lastSentAt.getTime() < 60_000) {
    throw new AppError(
      "Please wait one minute before requesting another code",
      429,
    );
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const now = new Date();
  const registration = {
    email: normalizedEmail,
    name: name.trim(),
    passwordHash: await bcrypt.hash(password, 12),
    codeHash: otpHash(normalizedEmail, code),
    expiresAt: new Date(now.getTime() + 10 * 60_000),
    lastSentAt: now,
    attempts: 0,
  };
  await RegistrationOtp.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: registration },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  try {
    await sendRegistrationCode(normalizedEmail, code);
  } catch (error) {
    await RegistrationOtp.deleteOne({ email: normalizedEmail });
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Could not send the verification email. Check SMTP settings and try again.",
      503,
    );
  }
  return {
    email: normalizedEmail,
    expiresInSeconds: 600,
    resendAfterSeconds: 60,
  };
};

const verifyRegistrationOtp = async ({ email, code }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const registration = await RegistrationOtp.findOne({
    email: normalizedEmail,
  }).select("+passwordHash +codeHash");
  if (!registration || registration.expiresAt <= new Date()) {
    if (registration) await registration.deleteOne();
    throw new AppError("Verification code is invalid or expired", 400);
  }
  if (registration.attempts >= 5) {
    await registration.deleteOne();
    throw new AppError(
      "Too many attempts. Request a new verification code.",
      429,
    );
  }

  const submittedHash = Buffer.from(otpHash(normalizedEmail, code), "hex");
  const expectedHash = Buffer.from(registration.codeHash, "hex");
  if (
    submittedHash.length !== expectedHash.length ||
    !crypto.timingSafeEqual(submittedHash, expectedHash)
  ) {
    registration.attempts += 1;
    if (registration.attempts >= 5) {
      await registration.deleteOne();
      throw new AppError(
        "Too many attempts. Request a new verification code.",
        429,
      );
    }
    await registration.save();
    throw new AppError("Verification code is incorrect", 400);
  }

  let user;
  try {
    user = await User.create({
      name: registration.name,
      email: normalizedEmail,
      password: registration.passwordHash,
      role: "CUSTOMER",
      isVerified: true,
    });
  } catch (error) {
    if (error.code === 11000)
      throw new AppError("Email is already registered", 409);
    throw error;
  }
  await registration.deleteOne();

  return { id: user._id, name: user.name, email: user.email, role: user.role };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been disabled", 403);
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  };
};

const refreshAccessToken = async (refreshToken) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await RefreshToken.findOne({
    tokenHash,
    user: payload.userId,
    revoked: false,
  });

  if (!storedToken) {
    throw new AppError("Refresh token is invalid or revoked", 401);
  }

  const user = await User.findById(payload.userId);

  if (!user || !user.isActive) {
    throw new AppError("User account is unavailable", 401);
  }

  const newAccessToken = generateAccessToken(user);

  return {
    accessToken: newAccessToken,
  };
};

const logout = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);

  await RefreshToken.updateOne(
    {
      tokenHash,
    },
    {
      $set: {
        revoked: true,
      },
    },
  );
};

module.exports = {
  requestRegistrationOtp,
  verifyRegistrationOtp,
  login,
  refreshAccessToken,
  logout,
};

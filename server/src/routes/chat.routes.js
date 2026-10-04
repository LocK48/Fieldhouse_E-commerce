const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate.middleware");
const schemas = require("../validations/schemas");
const controller = require("../controllers/chat.controller");

const router = express.Router();
router.use(authenticate);
router.get("/conversations", asyncHandler(controller.listConversations));
router.post("/conversations", validate(schemas.chatConversationCreate), asyncHandler(controller.createConversation));
router.get(
  "/conversations/:conversationId/messages",
  validate(schemas.idParams("conversationId"), "params"),
  validate(schemas.chatMessagesQuery, "query"),
  asyncHandler(controller.getMessages),
);

module.exports = router;

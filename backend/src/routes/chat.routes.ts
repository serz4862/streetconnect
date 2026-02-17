import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import 'express-async-errors';

const router = Router();

router.post('/send', authenticate, (req, res) => chatController.sendMessage(req, res));
router.get('/conversations', authenticate, (req, res) => chatController.getConversations(req, res));
router.get('/conversations/or-create', authenticate, (req, res) => chatController.getOrCreateConversation(req, res));
router.get('/conversations/:conversationId/messages', authenticate, (req, res) => chatController.getMessages(req, res));
router.put('/messages/:messageId/read', authenticate, (req, res) => chatController.markAsRead(req, res));
router.post('/conversations/:conversationId/typing', authenticate, (req, res) => chatController.sendTypingIndicator(req, res));
router.get('/unread-count', authenticate, (req, res) => chatController.getUnreadCount(req, res));

export default router;

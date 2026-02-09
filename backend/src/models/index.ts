import User from './User';
import Dog from './Dog';
import DogCaretaker from './DogCaretaker';
import FeedLog from './FeedLog';
import Report from './Report';
import Conversation from './Conversation';
import Message from './Message';
import Notification from './Notification';

// Define associations
User.hasMany(Dog, { foreignKey: 'created_by', as: 'dogs' });
Dog.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Dog Caretakers
Dog.belongsToMany(User, { through: DogCaretaker, foreignKey: 'dog_id', as: 'caretakers' });
User.belongsToMany(Dog, { through: DogCaretaker, foreignKey: 'user_id', as: 'cared_dogs' });

// Feed Logs
Dog.hasMany(FeedLog, { foreignKey: 'dog_id', as: 'feed_logs' });
FeedLog.belongsTo(Dog, { foreignKey: 'dog_id', as: 'dog' });
User.hasMany(FeedLog, { foreignKey: 'user_id', as: 'feed_logs' });
FeedLog.belongsTo(User, { foreignKey: 'user_id', as: 'feeder' });

// Reports
Dog.hasMany(Report, { foreignKey: 'dog_id', as: 'reports' });
Report.belongsTo(Dog, { foreignKey: 'dog_id', as: 'dog' });
User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'user_id', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });

// Conversations
Conversation.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

// Messages
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  User,
  Dog,
  DogCaretaker,
  FeedLog,
  Report,
  Conversation,
  Message,
  Notification,
};

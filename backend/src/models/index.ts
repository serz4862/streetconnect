// Re-export enums and types from models
// These are now used with Supabase directly, not Sequelize

export { UserRole, type UserAttributes } from './User';
export { DogGender, DogHealthStatus, type DogAttributes } from './Dog';
export { CaretakerType, type DogCaretakerAttributes } from './DogCaretaker';
export type { FeedLogAttributes } from './FeedLog';
export { ReportType, ReportStatus, type ReportAttributes } from './Report';
export type { ConversationAttributes } from './Conversation';
export type { MessageAttributes } from './Message';
export { NotificationType, type NotificationAttributes } from './Notification';

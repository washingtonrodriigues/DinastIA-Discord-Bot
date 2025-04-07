import * as handlers from './handlers';

export const OnboardingHandlers = {
  sendInitialMessage: handlers.sendInitialMessage,
  handleButtonInteraction: handlers.handleButtonInteraction,
  handleJuremaInteraction: handlers.handleJuremaInteraction,
  handleClearInactiveChannels: handlers.handleClearInactiveChannels,
  handleMemberLeave: handlers.handleMemberLeave,
};

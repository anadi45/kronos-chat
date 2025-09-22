/**
 * Progress Messages Utility
 * 
 * Provides random progress update messages for different stages of the chat process.
 * Includes slightly funny and engaging messages to make the user experience more enjoyable.
 */

export interface ProgressMessage {
  message: string;
  emoji: string;
}

export class ProgressMessages {
  private static readonly INITIAL_MESSAGES: ProgressMessage[] = [
    { emoji: '🤖', message: 'Getting started...' },
    { emoji: '🚀', message: 'Launching into action...' },
    { emoji: '⚡', message: 'Powering up the engines...' },
    { emoji: '🎯', message: 'Taking aim at your request...' },
    { emoji: '🔋', message: 'Charging up the brain cells...' },
    { emoji: '🌟', message: 'Activating the magic...' },
    { emoji: '🎪', message: 'Setting up the show...' },
    { emoji: '🎭', message: 'Getting into character...' },
  ];

  private static readonly PROCESSING_MESSAGES: ProgressMessage[] = [
    { emoji: '🧠', message: 'Working on your request...' },
    { emoji: '⚙️', message: 'Crunching the numbers...' },
    { emoji: '🔍', message: 'Digging deep into the data...' },
    { emoji: '💭', message: 'Thinking really hard...' },
    { emoji: '🎲', message: 'Rolling the dice of knowledge...' },
    { emoji: '🔮', message: 'Consulting the crystal ball...' },
    { emoji: '🧩', message: 'Piecing together the puzzle...' },
    { emoji: '🎨', message: 'Painting a masterpiece...' },
    { emoji: '🍳', message: 'Cooking up something special...' },
    { emoji: '🎪', message: 'Juggling multiple thoughts...' },
    { emoji: '🎯', message: 'Zeroing in on the answer...' },
    { emoji: '🚀', message: 'Blasting through the problem...' },
  ];

  private static readonly TOOL_CALL_MESSAGES: ProgressMessage[] = [
    { emoji: '🔧', message: 'Gathering information...' },
    { emoji: '🛠️', message: 'Wielding the tools of knowledge...' },
    { emoji: '⚡', message: 'Channeling the power of APIs...' },
    { emoji: '🔍', message: 'Scouring the digital realm...' },
    { emoji: '📡', message: 'Sending signals across the web...' },
    { emoji: '🎣', message: 'Fishing for data...' },
    { emoji: '🕵️', message: 'Playing detective with your request...' },
    { emoji: '🎪', message: 'Performing digital acrobatics...' },
    { emoji: '🎭', message: 'Putting on the research hat...' },
    { emoji: '🚀', message: 'Launching data collection mission...' },
    { emoji: '🔮', message: 'Casting spells on the internet...' },
    { emoji: '🎲', message: 'Rolling for information...' },
  ];

  private static readonly TOOL_RESULT_MESSAGES: ProgressMessage[] = [
    { emoji: '✅', message: 'Found what I need!' },
    { emoji: '🎉', message: 'Success! Data acquired!' },
    { emoji: '🏆', message: 'Mission accomplished!' },
    { emoji: '✨', message: 'Magic happened!' },
    { emoji: '🎯', message: 'Bullseye! Got the info!' },
    { emoji: '🚀', message: 'Data successfully retrieved!' },
    { emoji: '💎', message: 'Struck gold with the data!' },
    { emoji: '🎪', message: 'The show must go on!' },
    { emoji: '🔮', message: 'The crystal ball delivered!' },
    { emoji: '🎨', message: 'Masterpiece of data collection!' },
    { emoji: '🍳', message: 'Perfectly cooked data!' },
    { emoji: '🎭', message: 'The performance was flawless!' },
  ];

  private static readonly GENERATING_MESSAGES: ProgressMessage[] = [
    { emoji: '✍️', message: 'Writing your response...' },
    { emoji: '📝', message: 'Crafting the perfect answer...' },
    { emoji: '🎨', message: 'Painting words on the canvas...' },
    { emoji: '🏗️', message: 'Building your response brick by brick...' },
    { emoji: '🎪', message: 'Preparing the grand finale...' },
    { emoji: '🎭', message: 'Delivering the performance...' },
    { emoji: '🎯', message: 'Aiming for the perfect response...' },
    { emoji: '🚀', message: 'Launching your personalized answer...' },
    { emoji: '✨', message: 'Sprinkling some AI magic...' },
    { emoji: '🎲', message: 'Rolling the perfect words...' },
    { emoji: '🔮', message: 'Crystal ball is writing...' },
    { emoji: '🍳', message: 'Cooking up the final response...' },
  ];

  /**
   * Get a random initial progress message
   */
  static getRandomInitialMessage(): string {
    const message = this.getRandomMessage(this.INITIAL_MESSAGES);
    return `${message.emoji} ${message.message}`;
  }

  /**
   * Get a random processing progress message
   */
  static getRandomProcessingMessage(): string {
    const message = this.getRandomMessage(this.PROCESSING_MESSAGES);
    return `${message.emoji} ${message.message}`;
  }

  /**
   * Get a random tool call progress message
   */
  static getRandomToolCallMessage(): string {
    const message = this.getRandomMessage(this.TOOL_CALL_MESSAGES);
    return `${message.emoji} ${message.message}`;
  }

  /**
   * Get a random tool result progress message
   */
  static getRandomToolResultMessage(): string {
    const message = this.getRandomMessage(this.TOOL_RESULT_MESSAGES);
    return `${message.emoji} ${message.message}`;
  }

  /**
   * Get a random generating progress message
   */
  static getRandomGeneratingMessage(): string {
    const message = this.getRandomMessage(this.GENERATING_MESSAGES);
    return `${message.emoji} ${message.message}`;
  }

  /**
   * Get a random agent-specific progress message
   */
  static getRandomAgentMessage(agentName: string): string {
    const capitalizedAgent = agentName.charAt(0).toUpperCase() + agentName.slice(1);
    const agentMessages: ProgressMessage[] = [
      { emoji: '🔧', message: `${capitalizedAgent} agent is processing your request...` },
      { emoji: '⚡', message: `${capitalizedAgent} agent is working its magic...` },
      { emoji: '🎯', message: `${capitalizedAgent} agent is on the case...` },
      { emoji: '🚀', message: `${capitalizedAgent} agent is launching into action...` },
      { emoji: '🎪', message: `${capitalizedAgent} agent is performing...` },
      { emoji: '🎭', message: `${capitalizedAgent} agent is taking the stage...` },
      { emoji: '🔮', message: `${capitalizedAgent} agent is consulting the oracle...` },
      { emoji: '🎲', message: `${capitalizedAgent} agent is rolling the dice...` },
    ];
    
    const message = this.getRandomMessage(agentMessages);
    return `${message.emoji} ${message.message}`;
  }

  /**
   * Get a random agent-specific result message
   */
  static getRandomAgentResultMessage(agentName: string): string {
    const capitalizedAgent = agentName.charAt(0).toUpperCase() + agentName.slice(1);
    const agentResultMessages: ProgressMessage[] = [
      { emoji: '✅', message: `${capitalizedAgent} agent completed the task!` },
      { emoji: '🎉', message: `${capitalizedAgent} agent nailed it!` },
      { emoji: '🏆', message: `${capitalizedAgent} agent delivered!` },
      { emoji: '✨', message: `${capitalizedAgent} agent worked its magic!` },
      { emoji: '🎯', message: `${capitalizedAgent} agent hit the bullseye!` },
      { emoji: '🚀', message: `${capitalizedAgent} agent mission accomplished!` },
      { emoji: '💎', message: `${capitalizedAgent} agent struck gold!` },
      { emoji: '🎪', message: `${capitalizedAgent} agent's performance was perfect!` },
    ];
    
    const message = this.getRandomMessage(agentResultMessages);
    return `${message.emoji} ${message.message}`;
  }

  /**
   * Get a random message from the provided array
   */
  private static getRandomMessage(messages: ProgressMessage[]): ProgressMessage {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }
}

import { Tool } from '@langchain/core/tools';

/**
 * Custom Math Tools for Kronos Agent
 * 
 * Simple mathematical operations that the agent can use to perform calculations.
 */

/**
 * Custom tool class for math operations
 */
class MathTool extends Tool {
  name: string;
  description: string;
  private operation: (a: number, b: number) => number;

  constructor(name: string, description: string, operation: (a: number, b: number) => number) {
    super();
    this.name = name;
    this.description = description;
    this.operation = operation;
  }

  async _call(input: string): Promise<string> {
    try {
      const { a, b } = JSON.parse(input);
      const result = this.operation(a, b);
      return `The result of ${a} ${this.getOperator()} ${b} = ${result}`;
    } catch (error) {
      return 'Error: Invalid input format. Please provide a JSON string with "a" and "b" properties.';
    }
  }

  private getOperator(): string {
    switch (this.name) {
      case 'add': return '+';
      case 'subtract': return '-';
      case 'multiply': return '×';
      default: return '?';
    }
  }
}

/**
 * Add two numbers
 */
export const addTool = new MathTool(
  'add',
  'Add two numbers together. Input should be a JSON string with "a" and "b" properties.',
  (a, b) => a + b
);

/**
 * Subtract two numbers
 */
export const subtractTool = new MathTool(
  'subtract',
  'Subtract the second number from the first number. Input should be a JSON string with "a" and "b" properties.',
  (a, b) => a - b
);

/**
 * Multiply two numbers
 */
export const multiplyTool = new MathTool(
  'multiply',
  'Multiply two numbers together. Input should be a JSON string with "a" and "b" properties.',
  (a, b) => a * b
);

/**
 * Get all available math tools
 */
export const getMathTools = () => [addTool, subtractTool, multiplyTool];

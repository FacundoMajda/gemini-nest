import { flightTool } from './fligth.tool';

export const toolDefinitions = {
  [flightTool.name]: flightTool,
};

export type ToolName = keyof typeof toolDefinitions;

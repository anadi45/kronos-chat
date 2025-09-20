import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

export type ComposioTool = any;

export class LangChainToolConverter {
  static convert(composioTool: any) {
    // Validate tool structure
    if (!composioTool || !composioTool.function) {
      throw new Error('Invalid tool structure: missing function property');
    }

    const fn = composioTool.function;
    
    if (!fn.name) {
      throw new Error('Invalid tool structure: missing function name');
    }

    // Use a simple schema to avoid deep recursion issues
    const zodSchema = z.record(z.any());

    return new DynamicStructuredTool({
      name: fn.name,
      description: fn.description || `Tool: ${fn.name}`,
      schema: zodSchema,
      func: async (input: Record<string, any>) => {
        console.log(`[Tool Executed]: ${fn.name}`, input);
        return { success: true, input };
      },
    });
  }

  /** JSON Schema → Zod with extras in .describe() */
  private static jsonSchemaToZod(schema: any, depth = 0): z.ZodTypeAny {
    if (!schema || typeof schema !== "object") return z.any();
    
    // Prevent infinite recursion
    if (depth > 5) return z.any();

    // Clean the schema to remove unsupported fields for Gemini API
    const cleanedSchema = LangChainToolConverter.cleanSchemaForGemini(schema);

    let zod: z.ZodTypeAny;

    switch (cleanedSchema.type) {
      case "string":
        zod = z.string();
        break;

      case "boolean":
        zod = z.boolean();
        break;

      case "integer":
      case "number":
        zod = z.number();
        break;

      case "array":
        // Simplified array handling
        zod = z.array(z.any());
        break;

      case "object": {
        // Simplified object handling - use record to avoid deep recursion
        if (depth > 2) {
          zod = z.record(z.any());
        } else {
          const props: Record<string, z.ZodTypeAny> = {};
          const properties = cleanedSchema.properties || {};
          const propKeys = Object.keys(properties).slice(0, 10); // Limit properties
          
          for (const k of propKeys) {
            props[k] = LangChainToolConverter.jsonSchemaToZod(properties[k], depth + 1);
          }
          zod = z.object(props);
        }
        break;
      }

      default:
        zod = z.any();
    }

    // Add description if available
    if (cleanedSchema.description) {
      zod = zod.describe(cleanedSchema.description);
    }

    return zod;
  }

  /**
   * Clean schema to remove fields not supported by Gemini API
   */
  private static cleanSchemaForGemini(schema: any): any {
    if (!schema || typeof schema !== "object") return schema;

    const cleaned = { ...schema };

    // Remove unsupported fields
    delete cleaned.examples;
    delete cleaned.file_uploadable;

    // Clean properties recursively
    if (cleaned.properties) {
      const cleanedProperties: Record<string, any> = {};
      for (const [key, value] of Object.entries(cleaned.properties)) {
        cleanedProperties[key] = LangChainToolConverter.cleanSchemaForGemini(value);
      }
      cleaned.properties = cleanedProperties;
    }

    // Clean items for arrays
    if (cleaned.items) {
      cleaned.items = LangChainToolConverter.cleanSchemaForGemini(cleaned.items);
    }

    return cleaned;
  }
}

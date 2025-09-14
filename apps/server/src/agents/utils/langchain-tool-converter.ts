import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

export type ComposioTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
};

export class LangChainToolConverter {
  static convert(composioTool: ComposioTool) {
    const fn = composioTool.function;

    // Convert JSON Schema to Zod
    const zodSchema = LangChainToolConverter.jsonSchemaToZod(
      fn.parameters
    );

    return new DynamicStructuredTool({
      name: fn.name,
      description: fn.description,
      schema: zodSchema,
      func: async (input) => {
        console.log(`[Tool Executed]: ${fn.name}`, input);
        return { success: true, input };
      },
    });
  }

  /** JSON Schema → Zod with extras in .describe() */
  private static jsonSchemaToZod(schema: any): z.ZodTypeAny {
    if (!schema || typeof schema !== "object") return z.any();

    let zod: z.ZodTypeAny;

    switch (schema.type) {
      case "string":
        zod = z.string();
        if (schema.enum) {
          zod = z.enum(schema.enum as [string, ...string[]]);
        }
        break;

      case "boolean":
        zod = z.boolean();
        break;

      case "integer":
      case "number": {
        let base = z.number();
        if (schema.minimum !== undefined) base = base.min(schema.minimum);
        if (schema.maximum !== undefined) base = base.max(schema.maximum);
        zod = base;
        break;
      }

      case "array":
        zod = z.array(
          LangChainToolConverter.jsonSchemaToZod(schema.items || {})
        );
        break;

      case "object": {
        const props: Record<string, z.ZodTypeAny> = {};
        for (const [k, v] of Object.entries(schema.properties || {})) {
          props[k] = LangChainToolConverter.jsonSchemaToZod(v);
        }
        zod = z.object(props);
        break;
      }

      default:
        zod = z.any();
    }

    // Merge description, examples, title, nullable into `.describe`
    const metaParts: string[] = [];
    if (schema.description) metaParts.push(schema.description);
    if (schema.title) metaParts.push(`Title: ${schema.title}`);
    if (schema.examples) metaParts.push(`Examples: ${schema.examples.join(", ")}`);
    if (schema.nullable) metaParts.push("Nullable: true");
    if (schema.default !== undefined) metaParts.push(`Default: ${schema.default}`);

    if (metaParts.length > 0) {
      zod = zod.describe(metaParts.join(" | "));
    }

    return zod;
  }
}

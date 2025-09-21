import { z } from 'zod';
import { DynamicStructuredTool } from '@langchain/core/tools';

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

    // Use the original JSON Schema format for Google API compatibility
    // Clean the schema but keep it in JSON Schema format
    let jsonSchema: any;

    try {
      if (fn.parameters && fn.parameters.properties) {
        jsonSchema = LangChainToolConverter.cleanSchema(fn.parameters);
      } else {
        throw new Error('Invalid tool structure: missing function parameters');
      }
    } catch (error) {
      throw new Error('Failed to clean tool parameters schema');
    }

    // Enhance description with examples if available
    let enhancedDescription = fn.description || `Tool: ${fn.name}`;
    if (fn.parameters && fn.parameters.properties) {
      const examples = LangChainToolConverter.extractExamplesFromSchema(
        fn.parameters
      );
      if (examples.length > 0) {
        enhancedDescription += `\n\nExamples:\n${examples.join('\n')}`;
      }
    }

    return new DynamicStructuredTool({
      name: fn.name,
      description: enhancedDescription,
      schema: jsonSchema,
      func: async (input: any) => {
        console.log(`[Tool Executed]: ${fn.name}`, input);
        return { success: true, input };
      },
    });
  }

  /** JSON Schema → Zod with proper type conversion */
  private static jsonSchemaToZod(schema: any, depth = 0): any {
    if (!schema || typeof schema !== 'object') return z.any();

    // Prevent infinite recursion
    if (depth > 10) return z.any();

    // Clean the schema to remove unsupported fields
    const cleanedSchema = LangChainToolConverter.cleanSchema(schema);

    let zod: any;

    // Handle const values (literals)
    if (cleanedSchema.const !== undefined) {
      zod = z.literal(cleanedSchema.const);
    }
    // Handle enum values
    else if (cleanedSchema.enum && Array.isArray(cleanedSchema.enum)) {
      zod = z.enum(cleanedSchema.enum);
    }
    // Handle union types (oneOf)
    else if (cleanedSchema.oneOf && Array.isArray(cleanedSchema.oneOf)) {
      const unionTypes = cleanedSchema.oneOf.map((subSchema: any) =>
        LangChainToolConverter.jsonSchemaToZod(subSchema, depth + 1)
      );
      zod = z.union(
        unionTypes as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
      );
    }
    // Handle intersection types (allOf)
    else if (cleanedSchema.allOf && Array.isArray(cleanedSchema.allOf)) {
      const intersectionTypes = cleanedSchema.allOf.map((subSchema: any) =>
        LangChainToolConverter.jsonSchemaToZod(subSchema, depth + 1)
      );
      zod = z.intersection(intersectionTypes[0], intersectionTypes[1]);
    }
    // Handle primitive types
    else {
      switch (cleanedSchema.type) {
        case 'string': {
          let stringZod = z.string();

          // Add string constraints
          if (typeof cleanedSchema.minLength === 'number') {
            stringZod = stringZod.min(cleanedSchema.minLength);
          }
          if (typeof cleanedSchema.maxLength === 'number') {
            stringZod = stringZod.max(cleanedSchema.maxLength);
          }
          if (cleanedSchema.pattern) {
            stringZod = stringZod.regex(new RegExp(cleanedSchema.pattern));
          }
          if (cleanedSchema.format === 'email') {
            stringZod = stringZod.email();
          }
          if (cleanedSchema.format === 'uri') {
            stringZod = stringZod.url();
          }
          if (cleanedSchema.format === 'uuid') {
            stringZod = stringZod.uuid();
          }
          if (cleanedSchema.format === 'date-time') {
            stringZod = stringZod.datetime();
          }
          if (cleanedSchema.format === 'path') {
            // Handle file path format
            if (cleanedSchema.description) {
              cleanedSchema.description += ' (File path required)';
            } else {
              cleanedSchema.description = 'File path required';
            }
          }

          zod = stringZod;
          break;
        }

        case 'boolean':
          zod = z.boolean();
          break;

        case 'integer': {
          let intZod = z.number().int();

          if (typeof cleanedSchema.minimum === 'number') {
            intZod = intZod.min(cleanedSchema.minimum);
          }
          if (typeof cleanedSchema.maximum === 'number') {
            intZod = intZod.max(cleanedSchema.maximum);
          }

          zod = intZod;
          break;
        }

        case 'number': {
          let numZod = z.number();

          if (typeof cleanedSchema.minimum === 'number') {
            numZod = numZod.min(cleanedSchema.minimum);
          }
          if (typeof cleanedSchema.maximum === 'number') {
            numZod = numZod.max(cleanedSchema.maximum);
          }

          zod = numZod;
          break;
        }

        case 'null':
          zod = z.null();
          break;

        case 'array': {
          let arrayZod: any;

          if (cleanedSchema.items) {
            const itemSchema = LangChainToolConverter.jsonSchemaToZod(
              cleanedSchema.items,
              depth + 1
            );
            arrayZod = z.array(itemSchema);
          } else {
            arrayZod = z.array(z.any());
          }

          // Add array constraints
          if (typeof cleanedSchema.minItems === 'number') {
            arrayZod = arrayZod.min(cleanedSchema.minItems);
          }
          if (typeof cleanedSchema.maxItems === 'number') {
            arrayZod = arrayZod.max(cleanedSchema.maxItems);
          }

          zod = arrayZod;
          break;
        }

        case 'object': {
          if (cleanedSchema.properties) {
            const props: Record<string, z.ZodTypeAny> = {};
            const required = cleanedSchema.required || [];

            // Convert each property
            for (const [key, value] of Object.entries(
              cleanedSchema.properties
            )) {
              let propZod = LangChainToolConverter.jsonSchemaToZod(
                value,
                depth + 1
              );

              // Make optional if not in required array
              if (!required.includes(key)) {
                propZod = propZod.optional();
              }

              props[key] = propZod;
            }

            zod = z.object(props);
          } else if (cleanedSchema.additionalProperties) {
            // Handle record types
            const valueSchema = LangChainToolConverter.jsonSchemaToZod(
              cleanedSchema.additionalProperties,
              depth + 1
            );
            zod = z.record(valueSchema);
          } else {
            zod = z.record(z.any());
          }
          break;
        }

        default:
          zod = z.any();
      }
    }

    // Handle nullable fields
    if (cleanedSchema.nullable === true) {
      zod = zod.nullable();
    }

    // Add description if available (enhanced with examples)
    let description = cleanedSchema.description || '';
    if (
      cleanedSchema.examples &&
      Array.isArray(cleanedSchema.examples) &&
      cleanedSchema.examples.length > 0
    ) {
      const examplesText = cleanedSchema.examples
        .map((ex: any) => `  - ${JSON.stringify(ex)}`)
        .join('\n');
      if (description) {
        description += `\n\nExamples:\n${examplesText}`;
      } else {
        description = `Examples:\n${examplesText}`;
      }
    }

    if (description) {
      zod = zod.describe(description);
    }

    // Handle default values
    if (cleanedSchema.default !== undefined) {
      zod = zod.default(cleanedSchema.default);
    }

    return zod;
  }

  /**
   * Clean schema to remove fields not supported by LangChain
   */
  private static cleanSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') return schema;

    const cleaned = { ...schema };

    // Remove unsupported fields that might cause issues with Google API
    delete cleaned.$schema;
    delete cleaned.$id;
    delete cleaned.$ref;
    delete cleaned.definitions;
    delete cleaned.$defs;
    delete cleaned.examples; // Remove examples from schema as they cause issues
    delete cleaned.title; // Remove title as it's not needed in Google API
    delete cleaned.file_uploadable; // Remove file_uploadable flag

    // Handle file_uploadable fields - convert to string with special description
    if (cleaned.file_uploadable === true) {
      cleaned.type = 'string';
      if (cleaned.description) {
        cleaned.description += ' (File upload required)';
      } else {
        cleaned.description = 'File upload required';
      }
    }

    // Clean properties recursively
    if (cleaned.properties) {
      const cleanedProperties: Record<string, any> = {};
      for (const [key, value] of Object.entries(cleaned.properties)) {
        cleanedProperties[key] = LangChainToolConverter.cleanSchema(value);
      }
      cleaned.properties = cleanedProperties;
    }

    // Clean items for arrays
    if (cleaned.items) {
      if (Array.isArray(cleaned.items)) {
        cleaned.items = cleaned.items.map((item: any) =>
          LangChainToolConverter.cleanSchema(item)
        );
      } else {
        cleaned.items = LangChainToolConverter.cleanSchema(cleaned.items);
      }
    }

    // Simplify oneOf schemas - take the first option to avoid complexity
    if (cleaned.oneOf && Array.isArray(cleaned.oneOf) && cleaned.oneOf.length > 0) {
      const firstOption = LangChainToolConverter.cleanSchema(cleaned.oneOf[0]);
      Object.assign(cleaned, firstOption);
      delete cleaned.oneOf;
    }

    // Simplify allOf schemas - merge properties
    if (cleaned.allOf && Array.isArray(cleaned.allOf)) {
      const mergedSchema = { type: 'object', properties: {}, required: [] };
      for (const subSchema of cleaned.allOf) {
        const cleanedSub = LangChainToolConverter.cleanSchema(subSchema);
        if (cleanedSub.properties) {
          Object.assign(mergedSchema.properties, cleanedSub.properties);
        }
        if (cleanedSub.required) {
          mergedSchema.required.push(...cleanedSub.required);
        }
      }
      Object.assign(cleaned, mergedSchema);
      delete cleaned.allOf;
    }

    // Remove anyOf schemas as Google API doesn't support them well
    if (cleaned.anyOf) {
      delete cleaned.anyOf;
    }

    return cleaned;
  }

  /**
   * Extract examples from schema for tool description
   */
  private static extractExamplesFromSchema(schema: any): string[] {
    const examples: string[] = [];

    if (!schema || !schema.properties) return examples;

    for (const [key, value] of Object.entries(schema.properties)) {
      const prop = value as any;
      if (
        prop.examples &&
        Array.isArray(prop.examples) &&
        prop.examples.length > 0
      ) {
        const propExamples = prop.examples.map(
          (ex: any) => `${key}: ${JSON.stringify(ex)}`
        );
        examples.push(...propExamples);
      }
    }

    return examples;
  }
}

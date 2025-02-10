import { ZodEffects } from 'zod';

export function getZodEffectShape(schema) {
  if (schema._def.typeName === 'ZodEffects') return getZodEffectShape(schema._def.schema);
  return schema.shape;
}

export function getFormDefaultValues(schema) {
  function getValue(typeName, schema) {
    switch (typeName) {
      case 'ZodNullable':
        return null;

      case 'ZodString':
        return '';

      case 'ZodBoolean':
        return false;

      case 'ZodNumber':
        return 0;

      case 'ZodDate':
        return new Date();

      case 'ZodArray':
        return [];

      case 'ZodObject':
        return getFormDefaultValues(schema);

      case 'ZodEffects':
        return getValue(schema._def.schema._def.typeName, schema);

      default:
        return undefined;
    }
  }

  let shape;

  if (schema instanceof ZodEffects) shape = getZodEffectShape(schema);
  else shape = schema.shape;

  return Object.fromEntries(
    Object.entries(shape).map(([key, fieldSchema]) => {
      const typeName = fieldSchema._def.typeName;
      const value = getValue(typeName, fieldSchema);
      return [key, value];
    })
  );
}

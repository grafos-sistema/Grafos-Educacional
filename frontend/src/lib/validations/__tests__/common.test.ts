import { describe, it, expect } from 'vitest';
import {
  cpfSchema,
  phoneSchema,
  emailSchema,
  passwordSchema,
  strongPasswordSchema,
  nameSchema,
  futureDateSchema,
  pastDateSchema,
  numberRangeSchema,
  uuidSchema,
} from '../common';

describe('Common Validation Schemas', () => {
  describe('cpfSchema', () => {
    it('should accept valid CPF', () => {
      expect(cpfSchema.safeParse('111.444.777-35').success).toBe(true);
      expect(cpfSchema.safeParse('11144477735').success).toBe(true);
      expect(cpfSchema.safeParse('529.982.247-25').success).toBe(true);
    });

    it('should reject invalid CPF', () => {
      expect(cpfSchema.safeParse('123.456.789-00').success).toBe(false);
      expect(cpfSchema.safeParse('111.111.111-11').success).toBe(false);
      expect(cpfSchema.safeParse('00000000000').success).toBe(false);
    });

    it('should reject incomplete CPF', () => {
      expect(cpfSchema.safeParse('123.456').success).toBe(false);
      expect(cpfSchema.safeParse('123456789').success).toBe(false);
    });

    it('should provide error message for invalid CPF', () => {
      const result = cpfSchema.safeParse('123.456.789-00');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('CPF inválido');
      }
    });
  });

  describe('phoneSchema', () => {
    it('should accept valid landline phone (10 digits)', () => {
      expect(phoneSchema.safeParse('(11) 3333-4444').success).toBe(true);
      expect(phoneSchema.safeParse('1133334444').success).toBe(true);
    });

    it('should accept valid mobile phone (11 digits)', () => {
      expect(phoneSchema.safeParse('(11) 98765-4321').success).toBe(true);
      expect(phoneSchema.safeParse('11987654321').success).toBe(true);
    });

    it('should reject invalid DDD (below 11)', () => {
      expect(phoneSchema.safeParse('(00) 98765-4321').success).toBe(false);
      expect(phoneSchema.safeParse('(10) 3333-4444').success).toBe(false);
    });

    it('should reject mobile phone without 9 as third digit', () => {
      expect(phoneSchema.safeParse('(11) 88765-4321').success).toBe(false);
      expect(phoneSchema.safeParse('11887654321').success).toBe(false);
    });

    it('should reject incomplete phone', () => {
      expect(phoneSchema.safeParse('(11) 9876').success).toBe(false);
      expect(phoneSchema.safeParse('119876').success).toBe(false);
    });

    it('should accept valid DDDs (11-99)', () => {
      expect(phoneSchema.safeParse('(11) 98765-4321').success).toBe(true);
      expect(phoneSchema.safeParse('(99) 98765-4321').success).toBe(true);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid email', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true);
      expect(emailSchema.safeParse('test.user+tag@domain.co.uk').success).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(emailSchema.safeParse('invalid').success).toBe(false);
      expect(emailSchema.safeParse('invalid@').success).toBe(false);
      expect(emailSchema.safeParse('@domain.com').success).toBe(false);
    });

    it('should convert email to lowercase', () => {
      const result = emailSchema.safeParse('USER@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@example.com');
      }
    });
  });

  describe('passwordSchema', () => {
    it('should accept passwords with 6+ characters', () => {
      expect(passwordSchema.safeParse('pass123').success).toBe(true);
      expect(passwordSchema.safeParse('simple').success).toBe(true);
    });

    it('should reject password shorter than 6 characters', () => {
      expect(passwordSchema.safeParse('Pass1').success).toBe(false);
      expect(passwordSchema.safeParse('abc').success).toBe(false);
    });

    it('should reject password longer than 100 characters', () => {
      const longPassword = 'a'.repeat(101);
      expect(passwordSchema.safeParse(longPassword).success).toBe(false);
    });
  });

  describe('strongPasswordSchema', () => {
    it('should accept valid strong password', () => {
      expect(strongPasswordSchema.safeParse('Password123').success).toBe(true);
      expect(strongPasswordSchema.safeParse('MyP@ssw0rd').success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      expect(strongPasswordSchema.safeParse('Pass1').success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      expect(strongPasswordSchema.safeParse('password123').success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      expect(strongPasswordSchema.safeParse('PASSWORD123').success).toBe(false);
    });

    it('should reject password without number', () => {
      expect(strongPasswordSchema.safeParse('PasswordABC').success).toBe(false);
    });
  });

  describe('nameSchema', () => {
    it('should accept valid names', () => {
      expect(nameSchema.safeParse('João').success).toBe(true);
      expect(nameSchema.safeParse('Maria Silva').success).toBe(true);
      expect(nameSchema.safeParse("José O'Brien").success).toBe(true);
    });

    it('should reject names shorter than 2 characters', () => {
      expect(nameSchema.safeParse('A').success).toBe(false);
    });

    it('should reject names with numbers', () => {
      expect(nameSchema.safeParse('João123').success).toBe(false);
    });

    it('should reject names with special characters (except apostrophe)', () => {
      expect(nameSchema.safeParse('João@Silva').success).toBe(false);
      expect(nameSchema.safeParse('Maria#Silva').success).toBe(false);
    });
  });

  describe('futureDateSchema', () => {
    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 1 week in future
      const futureDateString = futureDate.toISOString().split('T')[0];
      expect(futureDateSchema.safeParse(futureDateString).success).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 1 week in past
      const pastDateString = pastDate.toISOString().split('T')[0];
      expect(futureDateSchema.safeParse(pastDateString).success).toBe(false);
    });
  });

  describe('pastDateSchema', () => {
    it('should accept past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateString = pastDate.toISOString().split('T')[0];
      expect(pastDateSchema.safeParse(pastDateString).success).toBe(true);
    });

    it('should accept today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(pastDateSchema.safeParse(today).success).toBe(true);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];
      expect(pastDateSchema.safeParse(futureDateString).success).toBe(false);
    });
  });

  describe('numberRangeSchema', () => {
    it('should accept numbers within range', () => {
      const schema = numberRangeSchema(0, 10, 'Valor');
      expect(schema.safeParse(0).success).toBe(true);
      expect(schema.safeParse(5).success).toBe(true);
      expect(schema.safeParse(10).success).toBe(true);
    });

    it('should reject numbers outside range', () => {
      const schema = numberRangeSchema(0, 10, 'Valor');
      expect(schema.safeParse(-1).success).toBe(false);
      expect(schema.safeParse(11).success).toBe(false);
    });

    it('should reject non-numbers', () => {
      const schema = numberRangeSchema(0, 10, 'Valor');
      expect(schema.safeParse('abc' as any).success).toBe(false);
    });
  });

  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      expect(uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);
      expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
      expect(uuidSchema.safeParse('123').success).toBe(false);
    });

    it('should reject empty string', () => {
      expect(uuidSchema.safeParse('').success).toBe(false);
    });
  });
});

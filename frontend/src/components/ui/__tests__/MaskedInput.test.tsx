import { describe, it, expect } from 'vitest';
import {
  removeMask,
  formatCPF,
  formatPhone,
  formatCEP,
  validateCPF,
} from '../MaskedInput';

describe('MaskedInput Utilities', () => {
  describe('removeMask', () => {
    it('should remove all non-digit characters', () => {
      expect(removeMask('123.456.789-00')).toBe('12345678900');
      expect(removeMask('(11) 98765-4321')).toBe('11987654321');
      expect(removeMask('12345-678')).toBe('12345678');
    });

    it('should handle strings with no mask', () => {
      expect(removeMask('12345678900')).toBe('12345678900');
    });

    it('should handle empty strings', () => {
      expect(removeMask('')).toBe('');
    });
  });

  describe('formatCPF', () => {
    it('should format valid 11-digit CPF', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00');
    });

    it('should format CPF with existing mask', () => {
      expect(formatCPF('123.456.789-00')).toBe('123.456.789-00');
    });

    it('should not format incomplete CPF', () => {
      expect(formatCPF('123456789')).toBe('123456789');
    });

    it('should handle empty string', () => {
      expect(formatCPF('')).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('should format 10-digit phone (landline)', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });

    it('should format 11-digit phone (mobile)', () => {
      expect(formatPhone('11987654321')).toBe('(11) 9 8765-4321');
    });

    it('should format phone with existing mask', () => {
      expect(formatPhone('(11) 9 8765-4321')).toBe('(11) 9 8765-4321');
    });

    it('should not format incomplete phone', () => {
      expect(formatPhone('1198765')).toBe('1198765');
    });

    it('should handle empty string', () => {
      expect(formatPhone('')).toBe('');
    });
  });

  describe('formatCEP', () => {
    it('should format valid 8-digit CEP', () => {
      expect(formatCEP('12345678')).toBe('12345-678');
    });

    it('should format CEP with existing mask', () => {
      expect(formatCEP('12345-678')).toBe('12345-678');
    });

    it('should not format incomplete CEP', () => {
      expect(formatCEP('12345')).toBe('12345');
    });

    it('should handle empty string', () => {
      expect(formatCEP('')).toBe('');
    });
  });

  describe('validateCPF', () => {
    it('should validate correct CPF', () => {
      // Valid CPF examples
      expect(validateCPF('111.444.777-35')).toBe(true);
      expect(validateCPF('11144477735')).toBe(true);
    });

    it('should invalidate CPF with all same digits', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('00000000000')).toBe(false);
      expect(validateCPF('99999999999')).toBe(false);
    });

    it('should invalidate CPF with wrong check digits', () => {
      expect(validateCPF('123.456.789-00')).toBe(false);
      expect(validateCPF('111.444.777-00')).toBe(false);
    });

    it('should invalidate incomplete CPF', () => {
      expect(validateCPF('123.456.789')).toBe(false);
      expect(validateCPF('123456')).toBe(false);
    });

    it('should invalidate CPF with more than 11 digits', () => {
      expect(validateCPF('123.456.789-000')).toBe(false);
    });

    it('should invalidate empty string', () => {
      expect(validateCPF('')).toBe(false);
    });

    it('should validate real CPF examples', () => {
      // These are valid CPF numbers for testing
      expect(validateCPF('529.982.247-25')).toBe(true);
      expect(validateCPF('52998224725')).toBe(true);
    });
  });
});

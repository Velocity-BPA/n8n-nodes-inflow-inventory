/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	cleanObject,
	isValidGuid,
	buildQueryParams,
	formatDate,
	formatDateTime,
	createReference,
} from '../../nodes/InFlowInventory/utils/helpers';

describe('Helper Functions', () => {
	describe('cleanObject', () => {
		it('should remove undefined values', () => {
			const input = { a: 1, b: undefined, c: 'test' };
			const result = cleanObject(input);
			expect(result).toEqual({ a: 1, c: 'test' });
		});

		it('should remove null values', () => {
			const input = { a: 1, b: null, c: 'test' };
			const result = cleanObject(input);
			expect(result).toEqual({ a: 1, c: 'test' });
		});

		it('should remove empty strings', () => {
			const input = { a: 1, b: '', c: 'test' };
			const result = cleanObject(input);
			expect(result).toEqual({ a: 1, c: 'test' });
		});

		it('should keep zero values', () => {
			const input = { a: 0, b: 'test' };
			const result = cleanObject(input);
			expect(result).toEqual({ a: 0, b: 'test' });
		});

		it('should keep false values', () => {
			const input = { a: false, b: 'test' };
			const result = cleanObject(input);
			expect(result).toEqual({ a: false, b: 'test' });
		});

		it('should handle empty objects', () => {
			const input = {};
			const result = cleanObject(input);
			expect(result).toEqual({});
		});
	});

	describe('isValidGuid', () => {
		it('should return true for valid GUIDs', () => {
			expect(isValidGuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
			expect(isValidGuid('00000000-0000-0000-0000-000000000000')).toBe(true);
		});

		it('should return false for invalid GUIDs', () => {
			expect(isValidGuid('not-a-guid')).toBe(false);
			expect(isValidGuid('550e8400-e29b-41d4-a716')).toBe(false);
			expect(isValidGuid('')).toBe(false);
		});

		it('should be case-insensitive', () => {
			expect(isValidGuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
		});
	});

	describe('buildQueryParams', () => {
		it('should build query params object from options', () => {
			const options = { limit: 50, after: 'abc123' };
			const result = buildQueryParams(options);
			expect(result).toEqual({ count: 50, after: 'abc123' });
		});

		it('should handle empty objects', () => {
			const result = buildQueryParams({});
			expect(result).toEqual({});
		});

		it('should handle include arrays', () => {
			const options = { include: ['cost', 'defaultPrice'] };
			const result = buildQueryParams(options);
			expect(result.include).toBe('cost,defaultPrice');
		});

		it('should handle smart filter', () => {
			const options = { smart: 'test search' };
			const result = buildQueryParams(options);
			expect(result['filter[smart]']).toBe('test search');
		});
	});

	describe('formatDate', () => {
		it('should format date strings correctly', () => {
			const result = formatDate('2024-03-15T10:30:00Z');
			expect(result).toBe('2024-03-15');
		});

		it('should handle Date objects', () => {
			const date = new Date('2024-03-15T10:30:00Z');
			const result = formatDate(date);
			expect(result).toBe('2024-03-15');
		});
	});

	describe('formatDateTime', () => {
		it('should format datetime strings correctly', () => {
			const result = formatDateTime('2024-03-15T10:30:00Z');
			expect(result).toContain('2024-03-15');
		});

		it('should handle Date objects', () => {
			const date = new Date('2024-03-15T10:30:00Z');
			const result = formatDateTime(date);
			expect(result).toContain('2024-03-15');
		});
	});

	describe('createReference', () => {
		it('should create entityId reference for valid GUIDs', () => {
			const result = createReference('550e8400-e29b-41d4-a716-446655440000');
			expect(result).toEqual({ entityId: '550e8400-e29b-41d4-a716-446655440000' });
		});

		it('should create name reference for non-GUIDs', () => {
			const result = createReference('Product Name');
			expect(result).toEqual({ name: 'Product Name' });
		});
	});
});

describe('Transport Functions', () => {
	// Note: These would require mocking the n8n context
	// For now we test the helper functions used by transport

	describe('buildIncludeParams', () => {
		const { buildIncludeParams } = require('../../nodes/InFlowInventory/transport');

		it('should join include values with commas', () => {
			const result = buildIncludeParams(['cost', 'defaultPrice', 'vendorItems']);
			expect(result).toBe('cost,defaultPrice,vendorItems');
		});

		it('should return empty string for empty array', () => {
			const result = buildIncludeParams([]);
			expect(result).toBe('');
		});
	});

	describe('buildFilterParams', () => {
		const { buildFilterParams } = require('../../nodes/InFlowInventory/transport');

		it('should build filter query params', () => {
			const filters = { smart: 'test', isActive: true };
			const result = buildFilterParams(filters);
			expect(result['filter[smart]']).toBe('test');
			expect(result['filter[isActive]']).toBe(true);
		});

		it('should skip undefined values', () => {
			const filters = { smart: 'test', isActive: undefined };
			const result = buildFilterParams(filters);
			expect(result['filter[smart]']).toBe('test');
			expect(result['filter[isActive]']).toBeUndefined();
		});
	});

	describe('buildAddress', () => {
		const { buildAddress } = require('../../nodes/InFlowInventory/transport');

		it('should build address object from flat data', () => {
			const addressData = {
				name: 'Test Company',
				address1: '123 Main St',
				city: 'Seattle',
				stateProvince: 'WA',
				postalCode: '98101',
				country: 'US',
			};
			const result = buildAddress(addressData);
			expect(result.name).toBe('Test Company');
			expect(result.address1).toBe('123 Main St');
			expect(result.city).toBe('Seattle');
		});

		it('should clean empty values', () => {
			const addressData = {
				name: 'Test',
				address1: '',
				city: 'Seattle',
			};
			const result = buildAddress(addressData);
			expect(result.name).toBe('Test');
			expect(result.address1).toBeUndefined();
			expect(result.city).toBe('Seattle');
		});
	});

	describe('handleEmptyResponse', () => {
		const { handleEmptyResponse } = require('../../nodes/InFlowInventory/transport');

		it('should return success message for empty delete response', () => {
			const result = handleEmptyResponse(undefined, 'delete');
			expect(result).toEqual({ success: true, operation: 'delete' });
		});

		it('should return original data if not empty', () => {
			const data = { entityId: '123' };
			const result = handleEmptyResponse(data, 'delete');
			expect(result).toEqual(data);
		});
	});
});

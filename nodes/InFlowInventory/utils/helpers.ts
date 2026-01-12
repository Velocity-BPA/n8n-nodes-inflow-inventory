/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

/**
 * Convert execution data to return format
 */
export function wrapData(data: IDataObject | IDataObject[]): INodeExecutionData[] {
	if (!Array.isArray(data)) {
		return [{ json: data }];
	}
	return data.map((item) => ({ json: item }));
}

/**
 * Get value from nested path
 */
export function getNestedValue(obj: IDataObject, path: string): any {
	const keys = path.split('.');
	let current: any = obj;

	for (const key of keys) {
		if (current === null || current === undefined) {
			return undefined;
		}
		current = current[key];
	}

	return current;
}

/**
 * Set value at nested path
 */
export function setNestedValue(obj: IDataObject, path: string, value: any): void {
	const keys = path.split('.');
	let current: any = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (current[key] === undefined) {
			current[key] = {};
		}
		current = current[key];
	}

	current[keys[keys.length - 1]] = value;
}

/**
 * Remove undefined and null values from object
 */
export function cleanObject(obj: IDataObject): IDataObject {
	const result: IDataObject = {};

	for (const [key, value] of Object.entries(obj)) {
		if (value !== undefined && value !== null && value !== '') {
			if (typeof value === 'object' && !Array.isArray(value)) {
				const cleaned = cleanObject(value as IDataObject);
				if (Object.keys(cleaned).length > 0) {
					result[key] = cleaned;
				}
			} else {
				result[key] = value;
			}
		}
	}

	return result;
}

/**
 * Parse JSON string if needed
 */
export function parseJson(value: string | IDataObject): IDataObject {
	if (typeof value === 'string') {
		try {
			return JSON.parse(value);
		} catch {
			return { value };
		}
	}
	return value;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
	}).format(value);
}

/**
 * Parse ISO date string to Date object
 */
export function parseDate(dateString: string): Date {
	return new Date(dateString);
}

/**
 * Get current ISO date string
 */
export function getCurrentIsoDate(): string {
	return new Date().toISOString();
}

/**
 * Validate GUID format
 */
export function isValidGuid(value: string): boolean {
	const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return guidRegex.test(value);
}

/**
 * Generate a reference object from ID or name
 */
export function createReference(value: string): IDataObject {
	if (isValidGuid(value)) {
		return { entityId: value };
	}
	return { name: value };
}

/**
 * Extract entity ID from response or reference
 */
export function extractEntityId(data: any): string | undefined {
	if (typeof data === 'string') {
		return isValidGuid(data) ? data : undefined;
	}
	if (data && typeof data === 'object') {
		return data.entityId;
	}
	return undefined;
}

/**
 * Merge additional fields into object
 */
export function mergeAdditionalFields(
	base: IDataObject,
	additionalFields: IDataObject,
): IDataObject {
	const result = { ...base };

	for (const [key, value] of Object.entries(additionalFields)) {
		if (value !== undefined && value !== null && value !== '') {
			// Handle nested objects (like addresses)
			if (key.includes('.')) {
				setNestedValue(result, key, value);
			} else {
				result[key] = value;
			}
		}
	}

	return result;
}

/**
 * Build query parameters from options
 */
export function buildQueryParams(options: IDataObject): IDataObject {
	const query: IDataObject = {};

	if (options.limit) {
		query.count = options.limit;
	}

	if (options.after) {
		query.after = options.after;
	}

	if (options.before) {
		query.before = options.before;
	}

	if (options.include && Array.isArray(options.include)) {
		query.include = (options.include as string[]).join(',');
	}

	if (options.smart) {
		query['filter[smart]'] = options.smart;
	}

	// Add date filters
	if (options.startDate) {
		query.startDate = options.startDate;
	}

	if (options.endDate) {
		query.endDate = options.endDate;
	}

	return query;
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
	const batches: T[][] = [];

	for (let i = 0; i < array.length; i += batchSize) {
		batches.push(array.slice(i, i + batchSize));
	}

	return batches;
}

/**
 * Delay execution
 */
export async function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
	operation: () => Promise<T>,
	maxRetries: number = 3,
	initialDelay: number = 1000,
): Promise<T> {
	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;

			if (attempt < maxRetries) {
				const delayMs = initialDelay * Math.pow(2, attempt);
				await delay(delayMs);
			}
		}
	}

	throw lastError;
}

/**
 * Safe JSON stringify
 */
export function safeStringify(obj: any): string {
	try {
		return JSON.stringify(obj);
	} catch {
		return String(obj);
	}
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) {
		return str;
	}
	return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toISOString().split('T')[0];
}

/**
 * Format date as ISO datetime string
 */
export function formatDateTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toISOString();
}

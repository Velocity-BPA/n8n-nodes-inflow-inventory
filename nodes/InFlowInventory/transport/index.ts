/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://cloudapi.inflowinventory.com';

/**
 * Make an API request to inFlow Inventory
 */
export async function inFlowApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
): Promise<any> {
	const credentials = await this.getCredentials('inFlowInventoryApi');

	const options: IRequestOptions = {
		method,
		uri: `${BASE_URL}/${credentials.companyId}${endpoint}`,
		headers: {
			Authorization: credentials.apiKey as string,
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (query && Object.keys(query).length > 0) {
		options.qs = query;
	}

	try {
		const response = await this.helpers.request(options);
		return response;
	} catch (error: any) {
		if (error.response) {
			const errorData = error.response.body;
			const message = errorData?.error?.message || error.message;
			const code = errorData?.error?.code || 'UNKNOWN_ERROR';
			throw new NodeApiError(this.getNode(), error as any, {
				message: `inFlow API Error [${code}]: ${message}`,
			});
		}
		throw new NodeApiError(this.getNode(), error as any, {
			message: `inFlow API Request Failed: ${error.message}`,
		});
	}
}

/**
 * Make an API request and return all items using cursor-based pagination
 */
export async function inFlowApiRequestAllItems(
	this: IExecuteFunctions | IPollFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
	limit?: number,
): Promise<any[]> {
	const returnData: any[] = [];
	let hasMore = true;
	let afterEntityId: string | undefined;
	const pageSize = 50;

	query = query || {};
	query.count = pageSize;

	while (hasMore) {
		if (afterEntityId) {
			query.after = afterEntityId;
		}

		const responseData = await inFlowApiRequest.call(this, method, endpoint, body, query);

		if (Array.isArray(responseData) && responseData.length > 0) {
			returnData.push(...responseData);
			afterEntityId = responseData[responseData.length - 1].entityId;
			hasMore = responseData.length === pageSize;

			// Check if we've reached the limit
			if (limit && returnData.length >= limit) {
				hasMore = false;
				return returnData.slice(0, limit);
			}
		} else {
			hasMore = false;
		}
	}

	return returnData;
}

/**
 * Build include parameter string for related data
 */
export function buildIncludeParams(includes: string[]): string {
	if (!includes || includes.length === 0) {
		return '';
	}
	return includes.join(',');
}

/**
 * Build filter parameters for smart search
 */
export function buildFilterParams(filters: IDataObject): IDataObject {
	const result: IDataObject = {};

	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== null && value !== '') {
			if (key === 'smart') {
				result['filter[smart]'] = value;
			} else {
				result[`filter[${key}]`] = value;
			}
		}
	}

	return result;
}

/**
 * Format date for API requests
 */
export function formatDate(date: string | Date): string {
	if (typeof date === 'string') {
		return date;
	}
	return date.toISOString();
}

/**
 * Parse entity reference from various input formats
 */
export function parseEntityReference(input: string | IDataObject): IDataObject {
	if (typeof input === 'string') {
		// Check if it's a GUID
		if (input.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
			return { entityId: input };
		}
		// Assume it's a name
		return { name: input };
	}
	return input;
}

/**
 * Build order line items from input
 */
export function buildOrderItems(
	items: IDataObject[],
	isLineItems: boolean = true,
): IDataObject[] {
	return items.map((item) => {
		const lineItem: IDataObject = {
			product: parseEntityReference(item.productId as string || item.product as string),
			quantity: item.quantity,
		};

		if (item.unitPrice !== undefined) {
			lineItem.unitPrice = item.unitPrice;
		}

		if (item.unitCost !== undefined) {
			lineItem.unitCost = item.unitCost;
		}

		if (item.discount !== undefined) {
			lineItem.discount = item.discount;
		}

		if (item.locationId) {
			lineItem.location = { entityId: item.locationId };
		}

		if (item.cost !== undefined) {
			lineItem.cost = item.cost;
		}

		return lineItem;
	});
}

/**
 * Build address object from input
 */
export function buildAddress(addressData: IDataObject): IDataObject {
	const address: IDataObject = {};

	const fields = [
		'name',
		'attention',
		'address1',
		'address2',
		'city',
		'stateProvince',
		'postalCode',
		'country',
		'phone',
	];

	for (const field of fields) {
		if (addressData[field]) {
			address[field] = addressData[field];
		}
	}

	return address;
}

/**
 * Simplify response data for output
 */
export function simplifyResponse(data: any, fields?: string[]): any {
	if (!fields || fields.length === 0) {
		return data;
	}

	if (Array.isArray(data)) {
		return data.map((item) => simplifyItem(item, fields));
	}

	return simplifyItem(data, fields);
}

function simplifyItem(item: IDataObject, fields: string[]): IDataObject {
	const result: IDataObject = {};

	for (const field of fields) {
		if (item[field] !== undefined) {
			result[field] = item[field];
		}
	}

	return result;
}

/**
 * Handle empty response
 */
export function handleEmptyResponse(response: any, operation: string): any {
	if (response === undefined || response === null || response === '') {
		return { success: true, operation };
	}
	return response;
}

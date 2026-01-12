/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import {
	inFlowApiRequest,
	inFlowApiRequestAllItems,
	buildOrderItems,
	handleEmptyResponse,
} from '../../transport';
import { cleanObject, createReference } from '../../utils/helpers';

export const stockAdjustmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['stockAdjustment'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a stock adjustment',
				action: 'Create a stock adjustment',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a stock adjustment',
				action: 'Delete a stock adjustment',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a stock adjustment by ID',
				action: 'Get a stock adjustment',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all stock adjustments',
				action: 'Get all stock adjustments',
			},
		],
		default: 'get',
	},
];

export const stockAdjustmentFields: INodeProperties[] = [
	// Adjustment ID
	{
		displayName: 'Adjustment ID',
		name: 'adjustmentId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['stockAdjustment'],
				operation: ['get', 'delete'],
			},
		},
		description: 'The unique identifier of the stock adjustment',
	},

	// Location for create
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['stockAdjustment'],
				operation: ['create'],
			},
		},
		description: 'Location name or ID for the adjustment',
	},

	// Adjustment Items
	{
		displayName: 'Adjustment Items',
		name: 'adjustmentItems',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		required: true,
		default: {},
		displayOptions: {
			show: {
				resource: ['stockAdjustment'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'items',
				displayName: 'Item',
				values: [
					{
						displayName: 'Product',
						name: 'productId',
						type: 'string',
						default: '',
						required: true,
						description: 'Product name or ID',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 0,
						required: true,
						description: 'Quantity to adjust (positive for increase, negative for decrease)',
					},
					{
						displayName: 'Cost',
						name: 'cost',
						type: 'number',
						typeOptions: {
							numberPrecision: 2,
						},
						default: 0,
						description: 'Unit cost for the adjustment',
					},
				],
			},
		],
		description: 'Items being adjusted',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['stockAdjustment'],
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},

	// Limit
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['stockAdjustment'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},

	// Filters
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['stockAdjustment'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				description: 'Filter by location name or ID',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Filter adjustments from this date',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Filter adjustments until this date',
			},
		],
	},

	// Additional fields for create
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['stockAdjustment'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Adjustment Number',
				name: 'adjustmentNumber',
				type: 'string',
				default: '',
				description: 'Custom adjustment reference number',
			},
			{
				displayName: 'Adjustment Date',
				name: 'adjustmentDate',
				type: 'dateTime',
				default: '',
				description: 'Date of the adjustment',
			},
			{
				displayName: 'Reason',
				name: 'reason',
				type: 'string',
				default: '',
				description: 'Adjustment reason name or ID',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Adjustment notes',
			},
		],
	},
];

export async function executeStockAdjustmentOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const adjustmentId = this.getNodeParameter('adjustmentId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/stockadjustments/${adjustmentId}`);
			break;
		}

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const query: IDataObject = {};

			if (filters.location) {
				query['filter[location]'] = filters.location;
			}
			if (filters.startDate) {
				query.startDate = filters.startDate;
			}
			if (filters.endDate) {
				query.endDate = filters.endDate;
			}

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/stockadjustments', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/stockadjustments', {}, query);
			}
			break;
		}

		case 'create': {
			const location = this.getNodeParameter('location', i) as string;
			const adjustmentItemsData = this.getNodeParameter('adjustmentItems', i, {}) as IDataObject;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = {
				location: createReference(location),
			};

			// Process adjustment items
			if (adjustmentItemsData.items && Array.isArray(adjustmentItemsData.items)) {
				body.items = buildOrderItems(adjustmentItemsData.items as IDataObject[]);
			}

			// Process additional fields
			if (additionalFields.adjustmentNumber) {
				body.adjustmentNumber = additionalFields.adjustmentNumber;
			}

			if (additionalFields.adjustmentDate) {
				body.adjustmentDate = additionalFields.adjustmentDate;
			} else {
				body.adjustmentDate = new Date().toISOString();
			}

			if (additionalFields.reason) {
				body.reason = createReference(additionalFields.reason as string);
			}

			if (additionalFields.notes) {
				body.notes = additionalFields.notes;
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/stockadjustments', cleanObject(body));
			break;
		}

		case 'delete': {
			const adjustmentId = this.getNodeParameter('adjustmentId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'DELETE', `/stockadjustments/${adjustmentId}`);
			responseData = handleEmptyResponse(responseData, 'delete');
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Stock Adjustment resource`);
	}

	return responseData;
}

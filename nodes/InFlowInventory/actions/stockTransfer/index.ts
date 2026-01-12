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
	handleEmptyResponse,
} from '../../transport';
import { cleanObject, createReference } from '../../utils/helpers';

export const stockTransferOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['stockTransfer'],
			},
		},
		options: [
			{
				name: 'Complete',
				value: 'complete',
				description: 'Complete a stock transfer',
				action: 'Complete a stock transfer',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new stock transfer',
				action: 'Create a stock transfer',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a stock transfer by ID',
				action: 'Get a stock transfer',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all stock transfers',
				action: 'Get all stock transfers',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a stock transfer',
				action: 'Update a stock transfer',
			},
			{
				name: 'Void',
				value: 'void',
				description: 'Void a stock transfer',
				action: 'Void a stock transfer',
			},
		],
		default: 'get',
	},
];

export const stockTransferFields: INodeProperties[] = [
	// Transfer ID
	{
		displayName: 'Transfer ID',
		name: 'transferId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['stockTransfer'],
				operation: ['get', 'update', 'complete', 'void'],
			},
		},
		description: 'The unique identifier of the stock transfer',
	},

	// Source Location for create
	{
		displayName: 'Source Location',
		name: 'sourceLocation',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['stockTransfer'],
				operation: ['create'],
			},
		},
		description: 'Source location name or ID',
	},

	// Destination Location for create
	{
		displayName: 'Destination Location',
		name: 'destinationLocation',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['stockTransfer'],
				operation: ['create'],
			},
		},
		description: 'Destination location name or ID',
	},

	// Return All
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['stockTransfer'],
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
				resource: ['stockTransfer'],
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
				resource: ['stockTransfer'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Open', value: 'Open' },
					{ name: 'Completed', value: 'Completed' },
					{ name: 'Void', value: 'Void' },
				],
				default: '',
				description: 'Filter by transfer status',
			},
			{
				displayName: 'Source Location',
				name: 'sourceLocation',
				type: 'string',
				default: '',
				description: 'Filter by source location',
			},
			{
				displayName: 'Destination Location',
				name: 'destinationLocation',
				type: 'string',
				default: '',
				description: 'Filter by destination location',
			},
			{
				displayName: 'Transfer Date From',
				name: 'transferDateFrom',
				type: 'dateTime',
				default: '',
				description: 'Filter transfers from this date',
			},
			{
				displayName: 'Transfer Date To',
				name: 'transferDateTo',
				type: 'dateTime',
				default: '',
				description: 'Filter transfers to this date',
			},
		],
	},

	// Transfer Items for create
	{
		displayName: 'Transfer Items',
		name: 'items',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['stockTransfer'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'itemValues',
				displayName: 'Item',
				values: [
					{
						displayName: 'Product',
						name: 'product',
						type: 'string',
						default: '',
						description: 'Product name or ID',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 1,
						description: 'Quantity to transfer',
					},
					{
						displayName: 'Source Sublocation',
						name: 'sourceSublocation',
						type: 'string',
						default: '',
						description: 'Specific source sublocation (optional)',
					},
					{
						displayName: 'Destination Sublocation',
						name: 'destinationSublocation',
						type: 'string',
						default: '',
						description: 'Specific destination sublocation (optional)',
					},
					{
						displayName: 'Serial Number',
						name: 'serialNumber',
						type: 'string',
						default: '',
						description: 'Serial number for serialized items',
					},
				],
			},
		],
		description: 'Items to transfer',
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
				resource: ['stockTransfer'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Transfer Number',
				name: 'transferNumber',
				type: 'string',
				default: '',
				description: 'Custom transfer number (auto-generated if not provided)',
			},
			{
				displayName: 'Transfer Date',
				name: 'transferDate',
				type: 'dateTime',
				default: '',
				description: 'Date of transfer (defaults to current date)',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Transfer notes',
			},
		],
	},

	// Update fields
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['stockTransfer'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Transfer notes',
			},
			{
				displayName: 'Transfer Date',
				name: 'transferDate',
				type: 'dateTime',
				default: '',
				description: 'Transfer date',
			},
		],
	},
];

function buildTransferItems(items: IDataObject): IDataObject[] {
	const itemValues = items.itemValues as IDataObject[] | undefined;
	if (!itemValues || itemValues.length === 0) {
		return [];
	}

	return itemValues.map((item) => {
		const transferItem: IDataObject = {
			product: createReference(item.product as string),
			quantity: item.quantity,
		};

		if (item.sourceSublocation) {
			transferItem.sourceSublocation = createReference(item.sourceSublocation as string);
		}
		if (item.destinationSublocation) {
			transferItem.destinationSublocation = createReference(item.destinationSublocation as string);
		}
		if (item.serialNumber) {
			transferItem.serialNumber = item.serialNumber;
		}

		return cleanObject(transferItem);
	});
}

export async function executeStockTransferOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];

	switch (operation) {
		case 'get': {
			const transferId = this.getNodeParameter('transferId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'GET', `/stockTransfers/${transferId}`);
			break;
		}

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const query: IDataObject = {};

			if (filters.status) {
				query['filter[status]'] = filters.status;
			}
			if (filters.sourceLocation) {
				query['filter[sourceLocation]'] = filters.sourceLocation;
			}
			if (filters.destinationLocation) {
				query['filter[destinationLocation]'] = filters.destinationLocation;
			}
			if (filters.transferDateFrom) {
				query['filter[transferDateFrom]'] = filters.transferDateFrom;
			}
			if (filters.transferDateTo) {
				query['filter[transferDateTo]'] = filters.transferDateTo;
			}

			if (returnAll) {
				responseData = await inFlowApiRequestAllItems.call(this, 'GET', '/stockTransfers', {}, query);
			} else {
				const limit = this.getNodeParameter('limit', i) as number;
				query.count = limit;
				responseData = await inFlowApiRequest.call(this, 'GET', '/stockTransfers', {}, query);
			}
			break;
		}

		case 'create': {
			const sourceLocation = this.getNodeParameter('sourceLocation', i) as string;
			const destinationLocation = this.getNodeParameter('destinationLocation', i) as string;
			const items = this.getNodeParameter('items', i, {}) as IDataObject;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			const body: IDataObject = {
				sourceLocation: createReference(sourceLocation),
				destinationLocation: createReference(destinationLocation),
			};

			// Build items
			const transferItems = buildTransferItems(items);
			if (transferItems.length > 0) {
				body.items = transferItems;
			}

			// Add additional fields
			if (additionalFields.transferNumber) {
				body.transferNumber = additionalFields.transferNumber;
			}
			if (additionalFields.transferDate) {
				body.transferDate = additionalFields.transferDate;
			}
			if (additionalFields.notes) {
				body.notes = additionalFields.notes;
			}

			responseData = await inFlowApiRequest.call(this, 'POST', '/stockTransfers', cleanObject(body));
			break;
		}

		case 'update': {
			const transferId = this.getNodeParameter('transferId', i) as string;
			const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			const body: IDataObject = {};

			if (updateFields.notes !== undefined) {
				body.notes = updateFields.notes;
			}
			if (updateFields.transferDate) {
				body.transferDate = updateFields.transferDate;
			}

			responseData = await inFlowApiRequest.call(this, 'PUT', `/stockTransfers/${transferId}`, cleanObject(body));
			break;
		}

		case 'complete': {
			const transferId = this.getNodeParameter('transferId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'POST', `/stockTransfers/${transferId}/complete`);
			break;
		}

		case 'void': {
			const transferId = this.getNodeParameter('transferId', i) as string;
			responseData = await inFlowApiRequest.call(this, 'POST', `/stockTransfers/${transferId}/void`);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Stock Transfer resource`);
	}

	return responseData;
}

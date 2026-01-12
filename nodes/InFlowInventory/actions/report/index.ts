/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { inFlowApiRequest } from '../../transport';
import { cleanObject } from '../../utils/helpers';

export const reportOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['report'],
			},
		},
		options: [
			{
				name: 'Get Inventory By Location',
				value: 'getInventoryByLocation',
				description: 'Get inventory report by location',
				action: 'Get inventory by location report',
			},
			{
				name: 'Get Inventory Summary',
				value: 'getInventorySummary',
				description: 'Get inventory summary report',
				action: 'Get inventory summary report',
			},
			{
				name: 'Get Low Stock',
				value: 'getLowStockReport',
				description: 'Get low stock items report',
				action: 'Get low stock report',
			},
			{
				name: 'Get Movement',
				value: 'getMovementReport',
				description: 'Get stock movement report',
				action: 'Get movement report',
			},
			{
				name: 'Get Purchase',
				value: 'getPurchaseReport',
				description: 'Get purchase summary report',
				action: 'Get purchase report',
			},
			{
				name: 'Get Sales',
				value: 'getSalesReport',
				description: 'Get sales summary report',
				action: 'Get sales report',
			},
			{
				name: 'Get Valuation',
				value: 'getValuationReport',
				description: 'Get inventory valuation report',
				action: 'Get valuation report',
			},
		],
		default: 'getInventorySummary',
	},
];

export const reportFields: INodeProperties[] = [
	// Date range for most reports
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: '',
		displayOptions: {
			show: {
				resource: ['report'],
				operation: ['getSalesReport', 'getPurchaseReport', 'getMovementReport'],
			},
		},
		description: 'Report start date',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		displayOptions: {
			show: {
				resource: ['report'],
				operation: ['getSalesReport', 'getPurchaseReport', 'getMovementReport'],
			},
		},
		description: 'Report end date',
	},

	// Common filter options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['report'],
				operation: [
					'getInventorySummary',
					'getInventoryByLocation',
					'getLowStockReport',
					'getValuationReport',
				],
			},
		},
		options: [
			{
				displayName: 'Location ID',
				name: 'locationId',
				type: 'string',
				default: '',
				description: 'Filter by location',
			},
			{
				displayName: 'Category ID',
				name: 'categoryId',
				type: 'string',
				default: '',
				description: 'Filter by category',
			},
			{
				displayName: 'Include Inactive',
				name: 'includeInactive',
				type: 'boolean',
				default: false,
				description: 'Whether to include inactive items',
			},
			{
				displayName: 'Group By',
				name: 'groupBy',
				type: 'options',
				options: [
					{ name: 'Product', value: 'product' },
					{ name: 'Category', value: 'category' },
					{ name: 'Location', value: 'location' },
				],
				default: 'product',
				description: 'How to group results',
			},
		],
	},

	// Options for date-based reports
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['report'],
				operation: ['getSalesReport', 'getPurchaseReport', 'getMovementReport'],
			},
		},
		options: [
			{
				displayName: 'Location ID',
				name: 'locationId',
				type: 'string',
				default: '',
				description: 'Filter by location',
			},
			{
				displayName: 'Category ID',
				name: 'categoryId',
				type: 'string',
				default: '',
				description: 'Filter by category',
			},
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						'/operation': ['getSalesReport'],
					},
				},
				description: 'Filter by customer',
			},
			{
				displayName: 'Vendor ID',
				name: 'vendorId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						'/operation': ['getPurchaseReport'],
					},
				},
				description: 'Filter by vendor',
			},
			{
				displayName: 'Group By',
				name: 'groupBy',
				type: 'options',
				options: [
					{ name: 'Product', value: 'product' },
					{ name: 'Category', value: 'category' },
					{ name: 'Location', value: 'location' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Vendor', value: 'vendor' },
				],
				default: 'product',
				description: 'How to group results',
			},
		],
	},
];

export async function executeReportOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[];
	const query: IDataObject = {};

	switch (operation) {
		case 'getInventorySummary': {
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (options.locationId) {
				query.locationId = options.locationId;
			}
			if (options.categoryId) {
				query.categoryId = options.categoryId;
			}
			if (options.includeInactive !== undefined) {
				query.includeInactive = options.includeInactive;
			}
			if (options.groupBy) {
				query.groupBy = options.groupBy;
			}

			responseData = await inFlowApiRequest.call(
				this,
				'GET',
				'/reports/inventorySummary',
				{},
				cleanObject(query),
			);
			break;
		}

		case 'getInventoryByLocation': {
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (options.locationId) {
				query.locationId = options.locationId;
			}
			if (options.categoryId) {
				query.categoryId = options.categoryId;
			}
			if (options.includeInactive !== undefined) {
				query.includeInactive = options.includeInactive;
			}
			if (options.groupBy) {
				query.groupBy = options.groupBy;
			}

			responseData = await inFlowApiRequest.call(
				this,
				'GET',
				'/reports/inventoryByLocation',
				{},
				cleanObject(query),
			);
			break;
		}

		case 'getSalesReport': {
			const startDate = this.getNodeParameter('startDate', i, '') as string;
			const endDate = this.getNodeParameter('endDate', i, '') as string;
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (startDate) {
				query.startDate = startDate;
			}
			if (endDate) {
				query.endDate = endDate;
			}
			if (options.locationId) {
				query.locationId = options.locationId;
			}
			if (options.categoryId) {
				query.categoryId = options.categoryId;
			}
			if (options.customerId) {
				query.customerId = options.customerId;
			}
			if (options.groupBy) {
				query.groupBy = options.groupBy;
			}

			responseData = await inFlowApiRequest.call(
				this,
				'GET',
				'/reports/sales',
				{},
				cleanObject(query),
			);
			break;
		}

		case 'getPurchaseReport': {
			const startDate = this.getNodeParameter('startDate', i, '') as string;
			const endDate = this.getNodeParameter('endDate', i, '') as string;
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (startDate) {
				query.startDate = startDate;
			}
			if (endDate) {
				query.endDate = endDate;
			}
			if (options.locationId) {
				query.locationId = options.locationId;
			}
			if (options.categoryId) {
				query.categoryId = options.categoryId;
			}
			if (options.vendorId) {
				query.vendorId = options.vendorId;
			}
			if (options.groupBy) {
				query.groupBy = options.groupBy;
			}

			responseData = await inFlowApiRequest.call(
				this,
				'GET',
				'/reports/purchases',
				{},
				cleanObject(query),
			);
			break;
		}

		case 'getLowStockReport': {
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (options.locationId) {
				query.locationId = options.locationId;
			}
			if (options.categoryId) {
				query.categoryId = options.categoryId;
			}
			if (options.includeInactive !== undefined) {
				query.includeInactive = options.includeInactive;
			}

			responseData = await inFlowApiRequest.call(
				this,
				'GET',
				'/reports/lowStock',
				{},
				cleanObject(query),
			);
			break;
		}

		case 'getValuationReport': {
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (options.locationId) {
				query.locationId = options.locationId;
			}
			if (options.categoryId) {
				query.categoryId = options.categoryId;
			}
			if (options.includeInactive !== undefined) {
				query.includeInactive = options.includeInactive;
			}
			if (options.groupBy) {
				query.groupBy = options.groupBy;
			}

			responseData = await inFlowApiRequest.call(
				this,
				'GET',
				'/reports/valuation',
				{},
				cleanObject(query),
			);
			break;
		}

		case 'getMovementReport': {
			const startDate = this.getNodeParameter('startDate', i, '') as string;
			const endDate = this.getNodeParameter('endDate', i, '') as string;
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (startDate) {
				query.startDate = startDate;
			}
			if (endDate) {
				query.endDate = endDate;
			}
			if (options.locationId) {
				query.locationId = options.locationId;
			}
			if (options.categoryId) {
				query.categoryId = options.categoryId;
			}
			if (options.groupBy) {
				query.groupBy = options.groupBy;
			}

			responseData = await inFlowApiRequest.call(
				this,
				'GET',
				'/reports/movement',
				{},
				cleanObject(query),
			);
			break;
		}

		default:
			throw new Error(`Operation "${operation}" is not supported for Report resource`);
	}

	return responseData;
}

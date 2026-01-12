/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	INodeExecutionData,
} from 'n8n-workflow';

import { productOperations, productFields, executeProductOperation } from './actions/product';
import { salesOrderOperations, salesOrderFields, executeSalesOrderOperation } from './actions/salesOrder';
import { purchaseOrderOperations, purchaseOrderFields, executePurchaseOrderOperation } from './actions/purchaseOrder';
import { customerOperations, customerFields, executeCustomerOperation } from './actions/customer';
import { vendorOperations, vendorFields, executeVendorOperation } from './actions/vendor';
import { locationOperations, locationFields, executeLocationOperation } from './actions/location';
import { stockAdjustmentOperations, stockAdjustmentFields, executeStockAdjustmentOperation } from './actions/stockAdjustment';
import { stockTransferOperations, stockTransferFields, executeStockTransferOperation } from './actions/stockTransfer';
import { categoryOperations, categoryFields, executeCategoryOperation } from './actions/category';
import { pricingLevelOperations, pricingLevelFields, executePricingLevelOperation } from './actions/pricingLevel';
import { adjustmentReasonOperations, adjustmentReasonFields, executeAdjustmentReasonOperation } from './actions/adjustmentReason';
import { reportOperations, reportFields, executeReportOperation } from './actions/report';
import { wrapData } from './utils/helpers';

// Display licensing notice once on load
const LICENSING_NOTICE_SHOWN = Symbol.for('inflow.licensing.shown');
if (!(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_SHOWN]) {
	console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
	(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_SHOWN] = true;
}

export class InFlowInventory implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'inFlow Inventory',
		name: 'inFlowInventory',
		icon: 'file:inflow.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage inventory, orders, and products with inFlow Inventory',
		defaults: {
			name: 'inFlow Inventory',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'inFlowInventoryApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Adjustment Reason',
						value: 'adjustmentReason',
					},
					{
						name: 'Category',
						value: 'category',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Location',
						value: 'location',
					},
					{
						name: 'Pricing Level',
						value: 'pricingLevel',
					},
					{
						name: 'Product',
						value: 'product',
					},
					{
						name: 'Purchase Order',
						value: 'purchaseOrder',
					},
					{
						name: 'Report',
						value: 'report',
					},
					{
						name: 'Sales Order',
						value: 'salesOrder',
					},
					{
						name: 'Stock Adjustment',
						value: 'stockAdjustment',
					},
					{
						name: 'Stock Transfer',
						value: 'stockTransfer',
					},
					{
						name: 'Vendor',
						value: 'vendor',
					},
				],
				default: 'product',
			},
			// Operations and fields for each resource
			...productOperations,
			...productFields,
			...salesOrderOperations,
			...salesOrderFields,
			...purchaseOrderOperations,
			...purchaseOrderFields,
			...customerOperations,
			...customerFields,
			...vendorOperations,
			...vendorFields,
			...locationOperations,
			...locationFields,
			...stockAdjustmentOperations,
			...stockAdjustmentFields,
			...stockTransferOperations,
			...stockTransferFields,
			...categoryOperations,
			...categoryFields,
			...pricingLevelOperations,
			...pricingLevelFields,
			...adjustmentReasonOperations,
			...adjustmentReasonFields,
			...reportOperations,
			...reportFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[];

				switch (resource) {
					case 'product':
						responseData = await executeProductOperation.call(this, operation, i);
						break;
					case 'salesOrder':
						responseData = await executeSalesOrderOperation.call(this, operation, i);
						break;
					case 'purchaseOrder':
						responseData = await executePurchaseOrderOperation.call(this, operation, i);
						break;
					case 'customer':
						responseData = await executeCustomerOperation.call(this, operation, i);
						break;
					case 'vendor':
						responseData = await executeVendorOperation.call(this, operation, i);
						break;
					case 'location':
						responseData = await executeLocationOperation.call(this, operation, i);
						break;
					case 'stockAdjustment':
						responseData = await executeStockAdjustmentOperation.call(this, operation, i);
						break;
					case 'stockTransfer':
						responseData = await executeStockTransferOperation.call(this, operation, i);
						break;
					case 'category':
						responseData = await executeCategoryOperation.call(this, operation, i);
						break;
					case 'pricingLevel':
						responseData = await executePricingLevelOperation.call(this, operation, i);
						break;
					case 'adjustmentReason':
						responseData = await executeAdjustmentReasonOperation.call(this, operation, i);
						break;
					case 'report':
						responseData = await executeReportOperation.call(this, operation, i);
						break;
					default:
						throw new Error(`Resource "${resource}" is not supported`);
				}

				const executionData = wrapData(responseData);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject } from 'n8n-workflow';

// Base types
export interface IInFlowEntity {
	entityId: string;
}

export interface IInFlowAddress {
	name?: string;
	attention?: string;
	address1?: string;
	address2?: string;
	city?: string;
	stateProvince?: string;
	postalCode?: string;
	country?: string;
	phone?: string;
}

export interface IInFlowReference {
	entityId: string;
	name?: string;
}

// Product types
export interface IInFlowProduct extends IInFlowEntity {
	name: string;
	sku?: string;
	barcode?: string;
	description?: string;
	category?: IInFlowReference;
	itemType?: 'StockedProduct' | 'NonstockedProduct' | 'Service';
	defaultPrice?: number;
	cost?: number;
	reorderPoint?: number;
	reorderQuantity?: number;
	weight?: number;
	weightUnit?: 'lb' | 'kg' | 'oz' | 'g';
	originCountry?: string;
	isActive?: boolean;
	vendorItems?: IInFlowVendorItem[];
	inventoryLines?: IInFlowInventoryLine[];
}

export interface IInFlowVendorItem {
	vendor: IInFlowReference;
	vendorSku?: string;
	cost?: number;
	isDefault?: boolean;
}

export interface IInFlowInventoryLine {
	location: IInFlowReference;
	quantityOnHand: number;
	quantityAllocated?: number;
	quantityAvailable?: number;
}

// Sales Order types
export interface IInFlowSalesOrder extends IInFlowEntity {
	orderNumber: string;
	orderDate: string;
	status?: 'Open' | 'PartiallyFulfilled' | 'Fulfilled' | 'Void';
	customer: IInFlowReference;
	currency?: string;
	subtotal?: number;
	taxTotal?: number;
	total?: number;
	shippingAddress?: IInFlowAddress;
	billingAddress?: IInFlowAddress;
	dueDate?: string;
	orderItems?: IInFlowSalesOrderItem[];
	notes?: string;
}

export interface IInFlowSalesOrderItem {
	product: IInFlowReference;
	quantity: number;
	unitPrice?: number;
	discount?: number;
	taxAmount?: number;
	total?: number;
	location?: IInFlowReference;
}

export interface IInFlowPayment {
	entityId?: string;
	paymentDate: string;
	amount: number;
	paymentMethod?: string;
	reference?: string;
	notes?: string;
}

export interface IInFlowShipment {
	entityId: string;
	shipmentDate: string;
	carrier?: string;
	trackingNumber?: string;
	items?: IInFlowShipmentItem[];
}

export interface IInFlowShipmentItem {
	product: IInFlowReference;
	quantity: number;
	location?: IInFlowReference;
}

// Purchase Order types
export interface IInFlowPurchaseOrder extends IInFlowEntity {
	orderNumber: string;
	orderDate: string;
	status?: 'Open' | 'PartiallyReceived' | 'Received' | 'Void';
	vendor: IInFlowReference;
	currency?: string;
	subtotal?: number;
	total?: number;
	expectedDate?: string;
	shippingAddress?: IInFlowAddress;
	orderItems?: IInFlowPurchaseOrderItem[];
	notes?: string;
}

export interface IInFlowPurchaseOrderItem {
	product: IInFlowReference;
	quantity: number;
	unitCost?: number;
	total?: number;
}

export interface IInFlowReceiving {
	entityId: string;
	receivingDate: string;
	items?: IInFlowReceivingItem[];
}

export interface IInFlowReceivingItem {
	product: IInFlowReference;
	quantity: number;
	location?: IInFlowReference;
}

// Customer types
export interface IInFlowCustomer extends IInFlowEntity {
	name: string;
	email?: string;
	phone?: string;
	currency?: string;
	pricingLevel?: IInFlowReference;
	taxNumber?: string;
	creditLimit?: number;
	paymentTerms?: string;
	billingAddress?: IInFlowAddress;
	shippingAddress?: IInFlowAddress;
	notes?: string;
	isActive?: boolean;
}

export interface IInFlowCustomerBalance {
	balance: number;
	currency: string;
}

// Vendor types
export interface IInFlowVendor extends IInFlowEntity {
	name: string;
	email?: string;
	phone?: string;
	currency?: string;
	paymentTerms?: string;
	accountNumber?: string;
	address?: IInFlowAddress;
	notes?: string;
	isActive?: boolean;
}

// Location types
export interface IInFlowLocation extends IInFlowEntity {
	name: string;
	description?: string;
	parentLocationId?: string;
	address?: IInFlowAddress;
	isPickable?: boolean;
	isReceivable?: boolean;
	isSellable?: boolean;
	isActive?: boolean;
}

// Stock Adjustment types
export interface IInFlowStockAdjustment extends IInFlowEntity {
	adjustmentNumber: string;
	adjustmentDate: string;
	reason?: IInFlowReference;
	location?: IInFlowReference;
	items?: IInFlowStockAdjustmentItem[];
	notes?: string;
}

export interface IInFlowStockAdjustmentItem {
	product: IInFlowReference;
	quantity: number;
	cost?: number;
}

// Stock Transfer types
export interface IInFlowStockTransfer extends IInFlowEntity {
	transferNumber: string;
	transferDate: string;
	status?: 'Open' | 'Completed' | 'Void';
	sourceLocation: IInFlowReference;
	destinationLocation: IInFlowReference;
	items?: IInFlowStockTransferItem[];
	notes?: string;
}

export interface IInFlowStockTransferItem {
	product: IInFlowReference;
	quantity: number;
}

// Category types
export interface IInFlowCategory extends IInFlowEntity {
	name: string;
	description?: string;
	parentCategoryId?: string;
	isActive?: boolean;
}

// Pricing Level types
export interface IInFlowPricingLevel extends IInFlowEntity {
	name: string;
	description?: string;
	isDefault?: boolean;
	isActive?: boolean;
}

// Adjustment Reason types
export interface IInFlowAdjustmentReason extends IInFlowEntity {
	name: string;
	description?: string;
	reasonType?: 'Increase' | 'Decrease';
	isActive?: boolean;
}

// Report types
export interface IInFlowReportParams {
	startDate?: string;
	endDate?: string;
	locationId?: string;
	categoryId?: string;
	includeInactive?: boolean;
	groupBy?: 'product' | 'category' | 'location';
}

// API Response types
export interface IInFlowApiError {
	error: {
		message: string;
		code: string;
	};
}

// Resource and Operation types for node
export type InFlowResource =
	| 'product'
	| 'salesOrder'
	| 'purchaseOrder'
	| 'customer'
	| 'vendor'
	| 'location'
	| 'stockAdjustment'
	| 'stockTransfer'
	| 'category'
	| 'pricingLevel'
	| 'adjustmentReason'
	| 'report';

export type ProductOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete'
	| 'getInventorySummary'
	| 'getBarcode'
	| 'getPricing'
	| 'getVendors';

export type SalesOrderOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete'
	| 'fulfill'
	| 'void'
	| 'addPayment'
	| 'getPayments'
	| 'getShipments';

export type PurchaseOrderOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete'
	| 'receive'
	| 'close'
	| 'void'
	| 'getReceivings';

export type CustomerOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete'
	| 'getOrders'
	| 'getAddresses'
	| 'addAddress'
	| 'getBalance';

export type VendorOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete'
	| 'getPurchaseOrders'
	| 'getProducts'
	| 'addProduct';

export type LocationOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete'
	| 'getInventory'
	| 'getSublocations';

export type StockAdjustmentOperation = 'get' | 'getAll' | 'create' | 'delete';

export type StockTransferOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'complete'
	| 'void';

export type CategoryOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete'
	| 'getProducts';

export type PricingLevelOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete'
	| 'getPrices';

export type AdjustmentReasonOperation =
	| 'get'
	| 'getAll'
	| 'create'
	| 'update'
	| 'delete';

export type ReportOperation =
	| 'getInventorySummary'
	| 'getInventoryByLocation'
	| 'getSalesReport'
	| 'getPurchaseReport'
	| 'getLowStockReport'
	| 'getValuationReport'
	| 'getMovementReport';

// Trigger event types
export type InFlowTriggerEvent =
	| 'product.created'
	| 'product.updated'
	| 'salesOrder.created'
	| 'salesOrder.updated'
	| 'salesOrder.fulfilled'
	| 'purchaseOrder.created'
	| 'purchaseOrder.received'
	| 'inventory.changed'
	| 'stockAdjustment.created'
	| 'stockTransfer.completed';

// Helper type for API requests
export interface IInFlowRequestOptions {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	endpoint: string;
	body?: IDataObject;
	query?: IDataObject;
}

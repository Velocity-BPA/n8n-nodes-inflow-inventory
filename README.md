# n8n-nodes-inflow-inventory

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for inFlow Inventory, enabling small business inventory management automation within n8n workflows. This integration provides complete access to inFlow's product tracking, sales order processing, purchase order management, and multi-location inventory capabilities.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **12 Resource Types**: Products, Sales Orders, Purchase Orders, Customers, Vendors, Locations, Stock Adjustments, Stock Transfers, Categories, Pricing Levels, Adjustment Reasons, and Reports
- **60+ Operations**: Complete CRUD operations plus specialized actions for each resource
- **Polling Trigger**: Monitor for new orders, inventory changes, and stock movements
- **Smart Search**: Cross-field search using inFlow's smart filter
- **Cursor Pagination**: Efficient handling of large datasets
- **Related Data**: Include options for cost, pricing, inventory, and vendor data

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-inflow-inventory`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-inflow-inventory

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-inflow-inventory.git
cd n8n-nodes-inflow-inventory

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-inflow-inventory

# Restart n8n
```

## Credentials Setup

| Field | Description |
|-------|-------------|
| **Company ID** | Your inFlow Company ID (GUID format). Found in Settings → Integrations → API Keys |
| **API Key** | Your inFlow API key. Generate in Settings → Integrations → API Keys |

### Getting Your API Credentials

1. Log in to inFlow Cloud at https://app.inflowinventory.com
2. Navigate to **Settings** → **Integrations**
3. Go to the **API Keys** section
4. Click **Add new API key**
5. Name your API key and copy the generated key
6. Note your **Company ID** from the same page

## Resources & Operations

### Product
- Get, Get All, Create, Update, Delete
- Get Inventory Summary
- Get Barcode, Get Pricing, Get Vendors

### Sales Order
- Get, Get All, Create, Update, Delete
- Fulfill, Void
- Add Payment, Get Payments, Get Shipments

### Purchase Order
- Get, Get All, Create, Update, Delete
- Receive, Close, Void
- Get Receivings

### Customer
- Get, Get All, Create, Update, Delete
- Get Orders, Get Addresses, Add Address
- Get Balance

### Vendor
- Get, Get All, Create, Update, Delete
- Get Purchase Orders, Get Products, Add Product

### Location
- Get, Get All, Create, Update, Delete
- Get Inventory, Get Sublocations

### Stock Adjustment
- Get, Get All, Create, Delete

### Stock Transfer
- Get, Get All, Create, Update
- Complete, Void

### Category
- Get, Get All, Create, Update, Delete
- Get Products

### Pricing Level
- Get, Get All, Create, Update, Delete
- Get Prices

### Adjustment Reason
- Get, Get All, Create, Update, Delete

### Report
- Inventory Summary, Inventory by Location
- Sales Report, Purchase Report
- Low Stock, Valuation, Movement

## Trigger Node

The inFlow Inventory Trigger node uses polling to detect changes:

| Event | Description |
|-------|-------------|
| Product Created | New product added |
| Product Updated | Product details modified |
| Sales Order Created | New sales order |
| Sales Order Updated | Sales order modified |
| Sales Order Fulfilled | Sales order shipped |
| Purchase Order Created | New purchase order |
| Purchase Order Received | PO items received |
| Stock Adjustment Created | Inventory adjusted |
| Stock Transfer Completed | Transfer completed |
| Inventory Changed | Stock levels changed |

**Minimum polling interval**: 60 seconds (recommended: 5 minutes)

## Usage Examples

### Get Low Stock Products

```javascript
// Use the Report resource
// Operation: Get Low Stock
// Options:
//   - Location ID: (optional) filter by warehouse
//   - Include Inactive: false
```

### Create a Sales Order

```javascript
// Use the Sales Order resource
// Operation: Create
// Customer: "Acme Corp" (or GUID)
// Order Items:
//   - Product: "Widget A"
//   - Quantity: 10
//   - Unit Price: 29.99
// Shipping Address: (configure as needed)
```

### Transfer Stock Between Locations

```javascript
// Use the Stock Transfer resource
// Operation: Create
// Source Location: "Warehouse A"
// Destination Location: "Warehouse B"
// Items:
//   - Product: "Widget A"
//   - Quantity: 50
```

## inFlow Concepts

### Entity IDs vs Names
Most resources accept either a GUID entity ID or a name. The node automatically detects which format you're using.

### Include Parameters
When fetching products or orders, you can include related data:
- `cost` - Product cost information
- `defaultPrice` - Default selling price
- `inventoryLines` - Stock levels by location
- `vendorItems` - Vendor-specific product info

### Smart Filter
The smart filter searches across multiple fields (name, SKU, barcode) to find matching records.

## Error Handling

The node provides detailed error messages from the inFlow API:

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 422 | Unprocessable - Validation failed |

## Security Best Practices

1. **Protect API Keys**: Store credentials securely using n8n's credential system
2. **Limit Permissions**: Use API keys with minimum required access
3. **Audit Access**: Regularly review API key usage in inFlow
4. **Use HTTPS**: All API calls use HTTPS encryption

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Format code
npm run format
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: [inFlow API Docs](https://developer.inflowinventory.com/)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-inflow-inventory/issues)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)

## Acknowledgments

- [inFlow Inventory](https://www.inflowinventory.com/) for their comprehensive API
- [n8n](https://n8n.io/) for the workflow automation platform
- The n8n community for inspiration and support

// 📁 File: orderItemGridLabels.js
// 📦 Description: All custom labels are downloaded from this file

import LabelTitle from '@salesforce/label/c.oms_table_title';
import OrderTotal from '@salesforce/label/c.oms_TotalOrder';
import ColProductName from '@salesforce/label/c.oms_col_Product';
import ColUnitPrice from '@salesforce/label/c.oms_col_UnitPrice';
import ColQuantity from '@salesforce/label/c.oms_col_Quantity';
import ColDiscount from '@salesforce/label/c.oms_col_Discount';
import ColOITotal from '@salesforce/label/c.oms_col_OITotal';
import ColActions from '@salesforce/label/c.oms_col_Actions';
import LabelApplyDiscount from '@salesforce/label/c.oms_ApplyDiscount';
import ButIncrease from '@salesforce/label/c.oms_but_IncreaseQty';
import ButDecrease from '@salesforce/label/c.oms_but_DecreaseQty';
import ButAddProduct from '@salesforce/label/c.oms_but_AddProduct';
import ButChangeProduct from '@salesforce/label/c.oms_but_UpdateProduct';
import ButCancelProduct from '@salesforce/label/c.oms_but_CancelProduct';
import LabelSave from '@salesforce/label/c.oms_save';
import LabelCancel from '@salesforce/label/c.oms_cancel';
import LabelClose from '@salesforce/label/c.oms_close';
import ButPrevious from '@salesforce/label/c.oms_Previous';
import ButNext from '@salesforce/label/c.oms_Next';
import ProductSearch from '@salesforce/label/c.oms_ProductSearch';
import NoAvailableProduct from '@salesforce/label/c.oms_NoProductMessage';

const labels = {
    table_title        : LabelTitle,
    orderTotal         : OrderTotal,
    applyDiscount      : LabelApplyDiscount,

    // Column header titles
    col_ProductName    : ColProductName,
    col_UnitPrice      : ColUnitPrice,
    col_Quantity       : ColQuantity,
    col_Discount       : ColDiscount,
    col_OITotal        : ColOITotal,
    col_Actions        : ColActions,

    // Buttons
    but_IncreaseQty    : ButIncrease,
    but_DecreaseQty    : ButDecrease,
    but_AddProduct     : ButAddProduct,
    but_ChangePdt      : ButChangeProduct,
    but_CancelPdt      : ButCancelProduct,
    but_Previous       : ButPrevious,
    but_Next           : ButNext,

    // Actions
    save               : LabelSave,
    cancel             : LabelCancel,
    close              : LabelClose,

    // Messages
    noAvailableProduct : NoAvailableProduct,
    searchBar          : ProductSearch
}

export { labels };
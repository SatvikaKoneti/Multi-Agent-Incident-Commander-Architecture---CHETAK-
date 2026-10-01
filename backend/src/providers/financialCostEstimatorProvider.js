import { readCsv, demoMeta } from './telemetryDataLoaderProvider.js';

/**
 * CostDataProvider - Telangana building material and labour rates.
 */
export class CostDataProvider {
  constructor() {
    this._rows = null;
    this.meta = demoMeta(
      'Telangana Building Material Prices',
      'Rates are approximate demo placeholders for estimation only and are NOT official current prices.',
    );
  }

  rows() {
    if (!this._rows) this._rows = readCsv('telangana_material_prices_demo.csv');
    return this._rows;
  }

  isDemo() {
    return true;
  }

  get sourceLabel() {
    return this.meta.sourceLabel;
  }

  getItem(key) {
    return this.rows().find((r) => r.item_key === key) || null;
  }

  rate(key) {
    const item = this.getItem(key);
    return item ? Number(item.base_rate_inr) : null;
  }

  itemDescription(key) {
    return this.getItem(key)?.item_name || key;
  }

  categories() {
    return [...new Set(this.rows().map((r) => r.category))];
  }
}

export class LiveCostDataProvider extends CostDataProvider {
  isDemo() {
    return false;
  }
}

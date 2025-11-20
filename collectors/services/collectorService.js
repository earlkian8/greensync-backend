import { api } from "@/config/api";

const normalizeResponse = (response) => response?.data?.data ?? response?.data ?? null;

const collectorService = {
  /**
   * Get today's assigned routes
   */
  async getTodayAssignments() {
    const response = await api.get('v1/collector/routes/today');
    return normalizeResponse(response);
  },

  /**
   * Get performance summary (stats for home page)
   */
  async getPerformanceSummary() {
    const response = await api.get('v1/collector/performance/summary');
    return normalizeResponse(response);
  },

  /**
   * Get collection history with filters
   * @param {Object} filters - { status, waste_type, search, start_date, end_date, month, year, per_page }
   */
  async getCollectionHistory(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.waste_type) params.append('waste_type', filters.waste_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.month) params.append('month', filters.month);
    if (filters.year) params.append('year', filters.year);
    if (filters.per_page) params.append('per_page', filters.per_page);

    const queryString = params.toString();
    const url = `v1/collector/performance/collections${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return normalizeResponse(response);
  },
};

export default collectorService;


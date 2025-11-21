import { api } from "@/config/api";
const normalizeResponse = (response) => response?.data?.data ?? response?.data ?? null;

const collectorRoutesService = {
  async getTodayAssignments() {
    const response = await api.get('v1/collector/routes/today');
    return normalizeResponse(response);
  },

  async getAllAssignments({ per_page = 50, status, start_date, end_date, barangay } = {}) {
    const params = {};
    if (per_page) params.per_page = per_page;
    if (status) params.status = status;
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;
    if (barangay) params.barangay = barangay;
    
    const response = await api.get('v1/collector/routes/all', { params });
    return normalizeResponse(response);
  },

  async getAssignmentDetails(assignmentId) {
    const response = await api.get(`v1/collector/routes/assignments/${assignmentId}`);
    return normalizeResponse(response);
  },

  async getPerformanceSummary() {
    const response = await api.get('v1/collector/performance/summary');
    return normalizeResponse(response);
  },

  async getCollectionHistory({ status, search, per_page = 50 } = {}) {
    const params = {};
    if (status && status !== 'all') {
      params.status = status;
    }
    if (search) {
      params.search = search;
    }
    if (per_page) {
      params.per_page = per_page;
    }
    const response = await api.get('v1/collector/performance/collections', { params });
    return normalizeResponse(response);
  },

  async scanBinQr({ assignmentId, qrCode }) {
    const response = await api.post('v1/collector/collections/scan', {
      assignment_id: assignmentId,
      qr_code: qrCode,
    });
    return normalizeResponse(response);
  },

  async recordCollection({
    assignmentId,
    binId,
    qrCode,
    latitude,
    longitude,
    wasteWeight,
    wasteType = 'mixed',
    notes,
  }) {
    const response = await api.post('v1/collector/collections/record', {
      assignment_id: assignmentId,
      bin_id: binId,
      qr_code: qrCode,
      latitude,
      longitude,
      waste_weight: wasteWeight,
      waste_type: wasteType,
      notes,
    });
    return normalizeResponse(response);
  },

  async manualCollectStop({
    assignmentId,
    stopId,
    latitude,
    longitude,
    wasteWeight,
    wasteType = 'mixed',
    notes,
  }) {
    const response = await api.post('v1/collector/collections/manual', {
      assignment_id: assignmentId,
      stop_id: stopId,
      latitude,
      longitude,
      waste_weight: wasteWeight,
      waste_type: wasteType,
      notes,
    });
    return normalizeResponse(response);
  },
};

export default collectorRoutesService;

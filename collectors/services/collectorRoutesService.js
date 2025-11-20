import { api } from "@/config/api";
const normalizeResponse = (response) => response?.data?.data ?? response?.data ?? null;

const collectorRoutesService = {
  async getAssignmentDetails(assignmentId) {
    const response = await api.get(`v1/collector/routes/assignments/${assignmentId}`);
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
};

export default collectorRoutesService;

import { useMemo } from "react";
import { useCollections } from "./useCollection";
import { useStudentDirectory } from "./useStudentDirectory";

/** Shared live data for every section of Security's single Gate Desk page. */
export function useGateDesk() {
  const { data, loading, error } = useCollections({
    passes: { name: "gatePasses", options: { limitCount: 1000 } },
    status: { name: "inOutStatus", options: { limitCount: 2000 } },
    logs: { name: "inOutLogs", options: { limitCount: 1000 } },
    legacy: { name: "gateLogs", options: { limitCount: 1000 } },
  }, { live: true, maxDocs: 2000 });
  const { directory, loading: directoryLoading, error: directoryError } = useStudentDirectory();

  const statusByStudent = useMemo(() => new Map(data.status.map((item) => [item.studentId || item.id, item])), [data.status]);
  const studentById = useMemo(() => new Map(directory.map((student) => [student.id, student])), [directory]);
  const passById = useMemo(() => new Map(data.passes.map((pass) => [pass.id, pass])), [data.passes]);

  const logs = useMemo(() => {
    const current = data.logs.map((entry) => ({ ...entry, gatePassId: entry.gatePassId || entry.passId || "", method: entry.method || (entry.gatePassId || entry.passId ? "scan" : "manual") }));
    const legacy = data.legacy.map((entry) => ({ ...entry, gatePassId: entry.gatePassId || entry.passId || "", direction: entry.direction || (entry.type === "OUT" ? "Out" : "In"), method: entry.method || "scan" }));
    const known = new Set(current.map((entry) => entry.id));
    return [...current, ...legacy.filter((entry) => !known.has(entry.id))].map((entry) => {
      const student = studentById.get(entry.studentId) || {};
      return { ...entry, studentName: entry.studentName || student.name || "Unknown student", registrationNo: entry.registrationNo || student.regNo || "", wing: entry.wing || student.wing || "", gender: entry.gender || student.gender || "Unspecified" };
    }).sort((a, b) => String(b.timeSort || "").localeCompare(String(a.timeSort || "")));
  }, [data.logs, data.legacy, studentById]);

  return {
    directory, studentById, passById, statusByStudent, passes: data.passes, logs,
    loading: loading || directoryLoading,
    error: error || directoryError,
  };
}

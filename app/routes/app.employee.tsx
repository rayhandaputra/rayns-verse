// app/routes/app.employee.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  useLoaderData,
  useActionData,
  Form,
  useRevalidator,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import type { Employee } from "../types";
import {
  formatCurrency,
  LOCATION_COORDS,
  MAX_DISTANCE_METERS,
} from "../constants";
import {
  Users,
  Camera,
  MapPin,
  DollarSign,
  Calendar,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import { API } from "~/lib/api";

// ============================================
// TYPES & INTERFACES
// ============================================

interface EmployeeWithSalary {
  id: string;
  name: string;
  role: string;
  phone: string;
  status: "active" | "inactive" | "on_leave";
  baseSalary: number;
  allowance: number;
  paymentType: "monthly" | "daily";
  attendanceToday?: {
    status: "present" | "permit" | "sick" | "absent";
    timeIn?: string;
    location?: string;
    photo?: string;
  };
}

interface LoaderData {
  employees: EmployeeWithSalary[];
}

interface ActionData {
  success?: boolean;
  message?: string;
}

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  // Fetch employees
  const employeesRes = await API.EMPLOYEE.get({
    session: { user, token },
    req: {
      query: {
        page: 0,
        size: 1000,
      },
    },
  });

  // Fetch today's attendance
  const today = new Date().toISOString().split("T")[0];
  const attendanceRes = await API.EMPLOYEE_ATTENDANCE.getTodayAttendance({
    session: { user, token },
    req: {},
  });

  // Fetch salaries
  const salariesRes = await API.EMPLOYEE_SALARY.get({
    session: { user, token },
    req: {
      query: {
        page: 0,
        size: 1000,
      },
    },
  });

  // Create salary map
  const salaryMap = new Map();
  (salariesRes.items || []).forEach((s: any) => {
    salaryMap.set(s.employee_id, {
      baseSalary: Number(s.base_salary) || 0,
      allowance: Number(s.allowances) || 0,
      paymentType: s.payment_type || "monthly",
    });
  });

  // Create attendance map
  const attendanceMap = new Map();
  (attendanceRes.items || []).forEach((a: any) => {
    attendanceMap.set(a.employee_id, {
      status: a.presence_status || "absent",
      timeIn: a.time_in || "",
      location: "Kantor",
      photo: a.selfie_path || "",
    });
  });

  // Combine data
  const mappedEmployees: EmployeeWithSalary[] = (employeesRes.items || []).map(
    (e: any) => {
      const salary = salaryMap.get(e.id) || {
        baseSalary: 0,
        allowance: 0,
        paymentType: "monthly",
      };
      const attendance = attendanceMap.get(e.id);

      return {
        id: String(e.id),
        name: e.name || "",
        role: e.structural || "",
        phone: e.phone || "",
        status: e.status || "active",
        baseSalary: salary.baseSalary,
        allowance: salary.allowance,
        paymentType: salary.paymentType,
        attendanceToday: attendance,
      };
    }
  );

  return { employees: mappedEmployees };
};

// ============================================
// ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_employee") {
    try {
      const name = formData.get("name") as string;
      const structural = formData.get("structural") as string;
      const phone = formData.get("phone") as string;
      const status = formData.get("status") as string;

      if (!name || !structural || !phone) {
        return Response.json({
          success: false,
          message: "Nama, jabatan, dan nomor HP wajib diisi",
        });
      }

      const response = await API.EMPLOYEE.create({
        session: { user, token },
        req: {
          body: {
            name,
            structural,
            phone,
            status: status || "active",
          },
        },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Pegawai berhasil ditambahkan",
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal menambahkan pegawai",
      });
    }
  }

  if (intent === "attendance") {
    try {
      const empId = formData.get("empId") as string;
      const empName = formData.get("empName") as string;
      const photoData = formData.get("photoData") as string;
      const locationStatus = formData.get("locationStatus") as string;
      const locationLat = formData.get("locationLat") as string;
      const locationLng = formData.get("locationLng") as string;

      if (locationStatus !== "Valid" || !photoData) {
        return Response.json({
          success: false,
          message: "Wajib Foto dan Lokasi Sesuai Kantor!",
        });
      }

      // Upload selfie to get URL
      // Note: photoData is base64, we need to convert to File first
      // For now, we'll save the base64 directly or implement upload later
      const selfiePath = photoData; // In production, upload to storage first

      const response = await API.EMPLOYEE_ATTENDANCE.clockIn({
        session: { user, token },
        req: {
          body: {
            employee_id: empId,
            employee_name: empName,
            location_lat_in: locationLat,
            location_long_in: locationLng,
            selfie_path: selfiePath,
          },
        },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Absensi Berhasil!",
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal menyimpan absensi",
      });
    }
  }

  if (intent === "update_salary") {
    try {
      const empId = formData.get("empId") as string;
      const empName = formData.get("empName") as string;
      const field = formData.get("field") as string;
      const value = Number(formData.get("value"));

      // Use upsert to create or update salary
      const updateData: any = {
        employee_id: empId,
        employee_name: empName,
      };

      if (field === "baseSalary") {
        updateData.base_salary = value;
      } else if (field === "allowance") {
        updateData.allowances = value;
      }

      // Get current salary data first
      const currentSalary = await API.EMPLOYEE_SALARY.get({
        session: { user, token },
        req: {
          query: {
            employee_id: empId,
            size: 1,
          },
        },
      });

      if (currentSalary.items && currentSalary.items.length > 0) {
        const curr = currentSalary.items[0];
        const response = await API.EMPLOYEE_SALARY.updateByEmployeeId({
          session: { user, token },
          req: {
            body: {
              employee_id: empId,
              employee_name: empName,
              base_salary: field === "baseSalary" ? value : curr.base_salary,
              allowances: field === "allowance" ? value : curr.allowances,
            },
          },
        });

        return Response.json({
          success: response.success,
          message: response.message || "Gaji berhasil diupdate",
        });
      } else {
        // Create new salary record
        const response = await API.EMPLOYEE_SALARY.create({
          session: { user, token },
          req: {
            body: {
              employee_id: empId,
              employee_name: empName,
              base_salary: field === "baseSalary" ? value : 0,
              allowances: field === "allowance" ? value : 0,
            },
          },
        });

        return Response.json({
          success: response.success,
          message: response.message || "Data gaji berhasil dibuat",
        });
      }
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal update gaji",
      });
    }
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function EmployeePage() {
  const { employees = [] } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const revalidator = useRevalidator();

  // ========== STATE ==========
  const [activeTab, setActiveTab] = useState<"list" | "attendance" | "salary">(
    "list"
  );
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);

  // Attendance State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "Checking" | "Valid" | "Invalid" | "Error"
  >("Checking");
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Salary Edit State
  const [salaryMonth, setSalaryMonth] = useState("01");
  const [tempSalary, setTempSalary] = useState<number>(0);

  // Add Employee Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: "",
    structural: "",
    phone: "",
    status: "active",
  });

  // ========== EFFECTS ==========
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      setPhotoData(null);
      setCurrentCoords(null);
      setLocationStatus("Checking");
      setSelectedEmp(null);
      setShowAddModal(false);
      setNewEmployeeForm({
        name: "",
        structural: "",
        phone: "",
        status: "active",
      });
      // Revalidate to refresh data
      revalidator.revalidate();
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  // ========== ATTENDANCE HANDLERS ==========
  const startCamera = async () => {
    setIsCameraOpen(true);
    setPhotoData(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      alert("Gagal membuka kamera: " + e);
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const data = canvasRef.current.toDataURL("image/jpeg");
        setPhotoData(data);

        // Stop Stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        setIsCameraOpen(false);
      }
    }
  };

  const checkLocation = () => {
    setLocationStatus("Checking");
    if (!navigator.geolocation) {
      setLocationStatus("Error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });

        // Simple Distance Calc (Haversine approx)
        const R = 6371e3; // metres
        const φ1 = (latitude * Math.PI) / 180;
        const φ2 = (LOCATION_COORDS.lat * Math.PI) / 180;
        const Δφ = ((LOCATION_COORDS.lat - latitude) * Math.PI) / 180;
        const Δλ = ((LOCATION_COORDS.lng - longitude) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;

        if (d <= MAX_DISTANCE_METERS) {
          setLocationStatus("Valid");
        } else {
          setLocationStatus("Invalid");
        }
      },
      (err) => setLocationStatus("Error")
    );
  };

  // ========== SALARY HANDLERS ==========
  const handleUpdateSalary = (
    empId: string,
    empName: string,
    field: "baseSalary" | "allowance",
    val: number
  ) => {
    // Create hidden form and submit
    const form = document.createElement("form");
    form.method = "post";
    form.style.display = "none";

    const intentInput = document.createElement("input");
    intentInput.type = "hidden";
    intentInput.name = "intent";
    intentInput.value = "update_salary";
    form.appendChild(intentInput);

    const empIdInput = document.createElement("input");
    empIdInput.type = "hidden";
    empIdInput.name = "empId";
    empIdInput.value = empId;
    form.appendChild(empIdInput);

    const empNameInput = document.createElement("input");
    empNameInput.type = "hidden";
    empNameInput.name = "empName";
    empNameInput.value = empName;
    form.appendChild(empNameInput);

    const fieldInput = document.createElement("input");
    fieldInput.type = "hidden";
    fieldInput.name = "field";
    fieldInput.value = field;
    form.appendChild(fieldInput);

    const valueInput = document.createElement("input");
    valueInput.type = "hidden";
    valueInput.name = "value";
    valueInput.value = String(val);
    form.appendChild(valueInput);

    document.body.appendChild(form);
    form.submit();
  };

  // Get selected employee data
  const selectedEmployee = selectedEmp
    ? employees.find((e) => e.id === selectedEmp)
    : null;

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "list"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Daftar Pegawai
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "attendance"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Absensi Harian
        </button>
        <button
          onClick={() => setActiveTab("salary")}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "salary"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Slip Gaji
        </button>
      </div>

      {/* LIST TAB */}
      {activeTab === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Daftar Pegawai</h2>
              <p className="text-gray-500 text-sm">
                Kelola data kepegawaian perusahaan.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Users size={16} /> Tambah Pegawai
            </button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-3">Nama Pegawai</th>
                <th className="px-6 py-3">Jabatan</th>
                <th className="px-6 py-3">No. HP</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees?.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    Belum ada data pegawai.
                  </td>
                </tr>
              )}
              {employees?.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {e.name}
                  </td>
                  <td className="px-6 py-3">{e.role}</td>
                  <td className="px-6 py-3 text-gray-500">{e.phone}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      e.status === "active"
                        ? "bg-green-100 text-green-700"
                        : e.status === "on_leave"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}>
                      {e.status === "active" ? "Aktif" : e.status === "on_leave" ? "Cuti" : "Tidak Aktif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Input Absensi */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Input Absensi</h2>
            <div className="space-y-4">
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                onChange={(e) => setSelectedEmp(e.target.value)}
                value={selectedEmp || ""}
              >
                <option value="">Pilih Pegawai...</option>
                {employees?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>

              {selectedEmp && (
                <div className="space-y-4">
                  {/* Camera */}
                  <div className="border border-gray-200 rounded-lg p-4 text-center bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center justify-center gap-2">
                      <Camera size={16} /> Foto Selfie
                    </h3>
                    {photoData ? (
                      <div className="relative inline-block">
                        <img
                          src={photoData}
                          className="w-40 h-32 object-cover rounded-lg border border-gray-300"
                          alt="Selfie"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoData(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : isCameraOpen ? (
                      <div className="flex flex-col items-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          className="w-64 h-48 bg-black mb-2 rounded"
                        />
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-blue-600 text-white px-4 py-1 rounded text-sm"
                        >
                          Ambil Foto
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Buka Kamera
                      </button>
                    )}
                    <canvas
                      ref={canvasRef}
                      width="320"
                      height="240"
                      className="hidden"
                    ></canvas>
                  </div>

                  {/* Location */}
                  <div className="border border-gray-200 rounded-lg p-4 text-center bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center justify-center gap-2">
                      <MapPin size={16} /> Lokasi GPS
                    </h3>
                    {locationStatus === "Checking" && (
                      <button
                        type="button"
                        onClick={checkLocation}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Cek Lokasi
                      </button>
                    )}
                    {locationStatus === "Valid" && (
                      <div className="text-green-600 text-sm font-bold flex items-center justify-center gap-1">
                        <Check size={16} /> Di Kantor
                      </div>
                    )}
                    {locationStatus === "Invalid" && (
                      <div className="text-red-600 text-sm font-bold flex items-center justify-center gap-1">
                        <AlertTriangle size={16} /> Di Luar Jangkauan
                      </div>
                    )}
                  </div>

                  {/* Submit Form */}
                  <Form method="post">
                    <input type="hidden" name="intent" value="attendance" />
                    <input type="hidden" name="empId" value={selectedEmp} />
                    <input type="hidden" name="empName" value={selectedEmployee?.name || ""} />
                    <input type="hidden" name="photoData" value={photoData || ""} />
                    <input type="hidden" name="locationStatus" value={locationStatus} />
                    <input type="hidden" name="locationLat" value={currentCoords?.lat || ""} />
                    <input type="hidden" name="locationLng" value={currentCoords?.lng || ""} />
                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                      disabled={!photoData || locationStatus !== "Valid"}
                    >
                      SUBMIT HADIR
                    </button>
                  </Form>
                </div>
              )}
            </div>
          </div>

          {/* Right: Today's Log */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Kehadiran Hari Ini</h2>
            <div className="space-y-3">
              {employees?.map((e) => (
                <div
                  key={e.id}
                  className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <div className="font-bold text-gray-800">{e.name}</div>
                    <div className="text-xs text-gray-500">{e.role}</div>
                  </div>
                  {e.attendanceToday ? (
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        e.attendanceToday.status === "present"
                          ? "bg-green-100 text-green-700"
                          : e.attendanceToday.status === "permit"
                            ? "bg-blue-100 text-blue-700"
                            : e.attendanceToday.status === "sick"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                      }`}>
                        {e.attendanceToday.status === "present"
                          ? "HADIR"
                          : e.attendanceToday.status === "permit"
                            ? "IZIN"
                            : e.attendanceToday.status === "sick"
                              ? "SAKIT"
                              : "ALPHA"}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {e.attendanceToday.timeIn}
                      </div>
                    </div>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                      Belum Absen
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SALARY TAB */}
      {activeTab === "salary" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Manajemen Gaji</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-gray-100 rounded text-xs font-medium hover:bg-gray-200">
                Harian
              </button>
              <button className="px-3 py-1 bg-gray-900 text-white rounded text-xs font-medium">
                Bulanan
              </button>
            </div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-3">Pegawai</th>
                <th className="px-6 py-3">Gaji Pokok</th>
                <th className="px-6 py-3">Tunjangan/Bonus</th>
                <th className="px-6 py-3">Total (Estimasi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees?.map((e) => (
                <tr key={e.id}>
                  <td className="px-6 py-3 font-medium">{e.name}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">Rp</span>
                      <input
                        type="number"
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
                        value={e.baseSalary}
                        onChange={(evt) =>
                          handleUpdateSalary(
                            e.id,
                            e.name,
                            "baseSalary",
                            Number(evt.target.value)
                          )
                        }
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">Rp</span>
                      <input
                        type="number"
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                        value={e.allowance}
                        onChange={(evt) =>
                          handleUpdateSalary(
                            e.id,
                            e.name,
                            "allowance",
                            Number(evt.target.value)
                          )
                        }
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-900">
                    {formatCurrency(e.baseSalary + e.allowance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Tambah Pegawai Baru</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="create_employee" />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  name="name"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={newEmployeeForm.name}
                  onChange={(e) =>
                    setNewEmployeeForm({ ...newEmployeeForm, name: e.target.value })
                  }
                  placeholder="Contoh: John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jabatan / Struktural
                </label>
                <input
                  name="structural"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={newEmployeeForm.structural}
                  onChange={(e) =>
                    setNewEmployeeForm({ ...newEmployeeForm, structural: e.target.value })
                  }
                  placeholder="Contoh: Manager"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor HP
                </label>
                <input
                  name="phone"
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={newEmployeeForm.phone}
                  onChange={(e) =>
                    setNewEmployeeForm({ ...newEmployeeForm, phone: e.target.value })
                  }
                  placeholder="08123456789"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={newEmployeeForm.status}
                  onChange={(e) =>
                    setNewEmployeeForm({ ...newEmployeeForm, status: e.target.value })
                  }
                >
                  <option value="active">Aktif</option>
                  <option value="on_leave">Cuti</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

// // views/tasks/CreateTaskModal.jsx
// import React, { useState, useEffect } from "react";
// import CustomModal from "../../components/CustomModal";
// import { useTaskStore } from "../../stores/useTaskStore";
// import { showError, showSuccess } from "../../components/toaster/Toaster";

// const CreateTaskModal = ({
//   isOpen,
//   onClose,
//   projectId,
//   phaseId,
//   phaseName,
//   onTaskCreated,
// }) => {
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     assignedTo: "",
//     teamId: "",
//     priority: "medium",
//     dueDate: "",
//     estimatedHours: "",
//     labels: "",
//   });

//   const { formData: formOptions, fetchFormData, createTask } = useTaskStore();

//   useEffect(() => {
//     if (isOpen && projectId) {
//       fetchFormData(projectId);
//     }
//   }, [isOpen, projectId]);

//   useEffect(() => {
//     if (isOpen) {
//       setFormData({
//         name: "",
//         description: "",
//         assignedTo: "",
//         teamId: "",
//         priority: "medium",
//         dueDate: "",
//         estimatedHours: "",
//         labels: "",
//       });
//     }
//   }, [isOpen]);

//   const handleSubmit = async () => {
//     if (!formData.name.trim()) {
//       showError("Please enter task name");
//       return;
//     }

//     const labelsArray = formData.labels
//       .split(",")
//       .map((label) => label.trim())
//       .filter((label) => label);

//     try {
//       setLoading(true);
//       await createTask({
//         name: formData.name,
//         description: formData.description,
//         projectId: projectId,
//         phaseId: phaseId,
//         assignedTo: formData.assignedTo || null,
//         teamId: formData.teamId || null,
//         priority: formData.priority,
//         dueDate: formData.dueDate || null,
//         estimatedHours: formData.estimatedHours
//           ? parseInt(formData.estimatedHours)
//           : 0,
//         labels: labelsArray,
//       });
//       showSuccess("Task created successfully!");
//       if (onTaskCreated) onTaskCreated();
//       onClose();
//     } catch (error) {
//       showError(error.response?.data?.message || "Failed to create task");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const priorityOptions = [
//     { value: "low", label: "Low", color: "text-gray-600" },
//     { value: "medium", label: "Medium", color: "text-blue-600" },
//     { value: "high", label: "High", color: "text-orange-600" },
//     { value: "urgent", label: "Urgent", color: "text-red-600" },
//   ];

//   return (
//     <CustomModal
//       isOpen={isOpen}
//       onClose={onClose}
//       title={`Create Task - ${phaseName || "Phase"}`}
//       size="md"
//       showFooter={true}
//       footerContent={
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//             disabled={loading}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={loading || !formData.name}
//             className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
//           >
//             {loading ? "Creating..." : "Create Task"}
//           </button>
//         </div>
//       }
//     >
//       <div className="space-y-4">
//         <div>
//           <label className="block mb-1 text-sm font-medium text-gray-700">
//             Task Name <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="text"
//             value={formData.name}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Enter task name"
//             disabled={loading}
//           />
//         </div>

//         <div>
//           <label className="block mb-1 text-sm font-medium text-gray-700">
//             Description
//           </label>
//           <textarea
//             value={formData.description}
//             onChange={(e) =>
//               setFormData({ ...formData, description: e.target.value })
//             }
//             rows="3"
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Describe the task..."
//             disabled={loading}
//           />
//         </div>

//         <div>
//           <label className="block mb-1 text-sm font-medium text-gray-700">
//             Assign To
//           </label>
//           <select
//             value={formData.assignedTo}
//             onChange={(e) =>
//               setFormData({ ...formData, assignedTo: e.target.value })
//             }
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             disabled={loading}
//           >
//             <option value="">Select a user</option>
//             {formOptions.users.map((user) => (
//               <option key={user._id} value={user._id}>
//                 {user.name} ({user.email})
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="block mb-1 text-sm font-medium text-gray-700">
//             Team
//           </label>
//           <select
//             value={formData.teamId}
//             onChange={(e) =>
//               setFormData({ ...formData, teamId: e.target.value })
//             }
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             disabled={loading}
//           >
//             <option value="">Select a team</option>
//             {formOptions.teams.map((team) => (
//               <option key={team._id} value={team._id}>
//                 {team.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="block mb-2 text-sm font-medium text-gray-700">
//             Priority
//           </label>
//           <div className="flex gap-4">
//             {priorityOptions.map((priority) => (
//               <label
//                 key={priority.value}
//                 className="flex items-center gap-2 cursor-pointer"
//               >
//                 <input
//                   type="radio"
//                   name="priority"
//                   value={priority.value}
//                   checked={formData.priority === priority.value}
//                   onChange={(e) =>
//                     setFormData({ ...formData, priority: e.target.value })
//                   }
//                   className="w-4 h-4"
//                   disabled={loading}
//                 />
//                 <span
//                   className={`text-sm font-medium capitalize ${priority.color}`}
//                 >
//                   {priority.label}
//                 </span>
//               </label>
//             ))}
//           </div>
//         </div>

//         <div>
//           <label className="block mb-1 text-sm font-medium text-gray-700">
//             Due Date
//           </label>
//           <input
//             type="date"
//             value={formData.dueDate}
//             onChange={(e) =>
//               setFormData({ ...formData, dueDate: e.target.value })
//             }
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             disabled={loading}
//           />
//         </div>

//         <div>
//           <label className="block mb-1 text-sm font-medium text-gray-700">
//             Estimated Hours
//           </label>
//           <input
//             type="number"
//             min="0"
//             step="0.5"
//             value={formData.estimatedHours}
//             onChange={(e) =>
//               setFormData({ ...formData, estimatedHours: e.target.value })
//             }
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Hours"
//             disabled={loading}
//           />
//         </div>

//         <div>
//           <label className="block mb-1 text-sm font-medium text-gray-700">
//             Labels (comma separated)
//           </label>
//           <input
//             type="text"
//             value={formData.labels}
//             onChange={(e) =>
//               setFormData({ ...formData, labels: e.target.value })
//             }
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="e.g., frontend, bug, feature"
//             disabled={loading}
//           />
//         </div>
//       </div>
//     </CustomModal>
//   );
// };

// export default CreateTaskModal;

// client/src/services/backlogPdf.service.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// The import above is the correct way to import autoTable

// Helper function to get status color
const getStatusColor = (status) => {
  const colors = {
    "Not started": "#F59E0B",
    Assigned: "#6366F1",
    "In progress": "#3B82F6",
    Complete: "#10B981",
    "On hold": "#EF4444",
    Pending: "#F59E0B",
  };
  return colors[status] || "#6B7280";
};

// Helper function to get priority color
const getPriorityColor = (priority) => {
  const colors = {
    Low: "#10B981",
    Medium: "#F59E0B",
    High: "#EF4444",
    low: "#10B981",
    medium: "#F59E0B",
    high: "#EF4444",
  };
  return colors[priority] || "#6B7280";
};

// Helper function to get status text color (for contrast)
const getStatusTextColor = (status) => {
  const colors = {
    "Not started": "#92400E",
    Assigned: "#3730A3",
    "In progress": "#1E40AF",
    Complete: "#065F46",
    "On hold": "#991B1B",
    Pending: "#92400E",
  };
  return colors[status] || "#1F2937";
};

export const generateBacklogPDF = async (backlogs, projectName, stats) => {
  return new Promise((resolve) => {
    // Create PDF with landscape orientation
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ─── Colors ──────────────────────────────────────────────────────────────
    const primaryColor = [59, 130, 246]; // #3B82F6
    const textColor = [31, 41, 55]; // #1F2937

    // ─── Header ─────────────────────────────────────────────────────────────
    // Add top border line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(2);
    doc.line(15, 15, pageWidth - 15, 15);

    // Title
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Backlog Report", 20, 35);

    // Project name
    doc.setFontSize(14);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${projectName || "All Projects"}`, 20, 45);

    // Generation date
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    const dateStr = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Generated: ${dateStr}`, 20, 52);

    // ─── Stats Section ─────────────────────────────────────────────────────
    const statsY = 65;
    const statsData = [
      { label: "Total", value: stats?.total || 0, color: "#3B82F6" },
      { label: "Pending", value: stats?.pending || 0, color: "#F59E0B" },
      { label: "In Progress", value: stats?.inProgress || 0, color: "#3B82F6" },
      { label: "Completed", value: stats?.completed || 0, color: "#10B981" },
    ];

    const statsWidth = (pageWidth - 40) / statsData.length;

    statsData.forEach((item, index) => {
      const x = 20 + index * statsWidth;
      const y = statsY;

      // Background
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, statsWidth - 5, 30, 2, 2, "FD");

      // Value
      doc.setFontSize(20);
      doc.setTextColor(item.color);
      doc.setFont("helvetica", "bold");
      doc.text(item.value.toString(), x + 8, y + 15);

      // Label
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, x + 8, y + 25);
    });

    // ─── Table ──────────────────────────────────────────────────────────────
    const tableY = statsY + 45;

    // Table headers
    const headers = [
      "ID",
      "Title",
      "Status",
      "Priority",
      "Category",
      "Assignee",
      "Created",
    ];

    // Table rows
    const rows = backlogs.map((backlog) => {
      const status = backlog.status || "Not started";
      const priority = backlog.priority || "Medium";

      return [
        `#${backlog._id?.toString().slice(-6) || "N/A"}`,
        backlog.title || "Untitled",
        status,
        priority,
        backlog.category?.name || "—",
        backlog.assignTo?.name || "Unassigned",
        backlog.createdAt
          ? new Date(backlog.createdAt).toLocaleDateString()
          : "—",
      ];
    });

    // If no rows, add empty row
    if (rows.length === 0) {
      rows.push(["—", "No backlogs found", "—", "—", "—", "—", "—"]);
    }

    // Generate table with autoTable
    autoTable(doc, {
      startY: tableY,
      head: [headers],
      body: rows,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        halign: "left",
        cellPadding: { top: 8, bottom: 8, left: 8, right: 8 },
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [31, 41, 55],
        cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "left" },
        1: { cellWidth: "auto", halign: "left" },
        2: { cellWidth: 25, halign: "left" },
        3: { cellWidth: 22, halign: "left" },
        4: { cellWidth: 25, halign: "left" },
        5: { cellWidth: 30, halign: "left" },
        6: { cellWidth: 25, halign: "left" },
      },
      // Custom cell rendering for status and priority
      didParseCell: function (data) {
        if (data.section === "body") {
          // Status column (index 2)
          if (data.column.index === 2) {
            const status = data.cell.raw;
            const color = getStatusColor(status);

            // Add colored background for status
            data.cell.styles = {
              ...data.cell.styles,
              fillColor: color + "33", // 20% opacity
              textColor: getStatusTextColor(status),
              fontStyle: "bold",
              fontSize: 8,
            };
          }

          // Priority column (index 3)
          if (data.column.index === 3) {
            const priority = data.cell.raw;
            const color = getPriorityColor(priority);

            // Add colored background for priority
            data.cell.styles = {
              ...data.cell.styles,
              fillColor: color + "33", // 20% opacity
              textColor: color,
              fontStyle: "bold",
              fontSize: 8,
            };
          }
        }
      },
      // Add border to table
      styles: {
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
      },
    });

    // ─── Footer ─────────────────────────────────────────────────────────────
    const finalY = doc.lastAutoTable.finalY || 250;

    // Add footer line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, finalY + 15, pageWidth - 15, finalY + 15);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total Backlogs: ${backlogs.length} | Generated by Accelerate`,
      20,
      finalY + 25,
    );

    // Page number
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }

    // ─── Return PDF ─────────────────────────────────────────────────────────
    resolve(doc);
  });
};

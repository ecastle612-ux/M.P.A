import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  formatCompletionDuration,
  WORK_ORDER_REPORT_PDF_ROW_CAP,
  type WorkOrderReportSnapshot
} from "@mpa/shared";

export async function buildWorkOrderReportPdf(snapshot: WorkOrderReportSnapshot): Promise<{
  bytes: Uint8Array;
  fileName: string;
}> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];
  const margin = 48;
  let page = pdf.addPage(pageSize);
  let y = 744;
  let pageNumber = 1;

  const footer = () => {
    page.drawText("Confidential · organization use only · M.P.A. Work Order Operations Report", {
      x: margin,
      y: 28,
      size: 8,
      font,
      color: rgb(0.45, 0.5, 0.55)
    });
    page.drawText(`Page ${pageNumber}`, {
      x: 612 - margin - 40,
      y: 28,
      size: 8,
      font,
      color: rgb(0.45, 0.5, 0.55)
    });
  };

  const ensure = (needed: number) => {
    if (y < margin + needed + 24) {
      footer();
      page = pdf.addPage(pageSize);
      pageNumber += 1;
      y = 744;
    }
  };

  const draw = (text: string, size: number, useBold = false, color = rgb(0.08, 0.12, 0.18)) => {
    ensure(size + 10);
    const safe = text.replace(/[^\x20-\x7E]/g, "?");
    page.drawText(safe.slice(0, 110), {
      x: margin,
      y,
      size,
      font: useBold ? bold : font,
      color,
      maxWidth: 612 - margin * 2
    });
    y -= size + 8;
  };

  draw("M.P.A. · Work Order Operations Report", 10, false, rgb(0.25, 0.45, 0.4));
  draw(snapshot.organizationName, 18, true);
  draw(snapshot.surfaceLabel, 11, false, rgb(0.3, 0.35, 0.4));
  draw(
    `Reporting period: ${snapshot.filters.dateFrom} to ${snapshot.filters.dateTo} (${snapshot.filters.dateMode} date)`,
    10
  );
  draw(
    `Generated ${new Date(snapshot.generatedAt).toLocaleString()} by ${snapshot.generatedByDisplayName}`,
    9,
    false,
    rgb(0.45, 0.5, 0.55)
  );
  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 612 - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.9)
  });
  y -= 16;

  draw("Summary metrics", 12, true);
  draw(`Total work orders: ${snapshot.metrics.total}`, 10);
  draw(`Open: ${snapshot.metrics.open}`, 10);
  draw(`In progress: ${snapshot.metrics.inProgress}`, 10);
  draw(`Completed: ${snapshot.metrics.completed}`, 10);
  draw(
    `Average completion time: ${formatCompletionDuration(snapshot.metrics.averageCompletionHours)}`,
    10
  );

  y -= 6;
  draw("Completion statistics", 12, true);
  draw(
    `Completion rate: ${
      snapshot.metrics.completionRate == null
        ? "Not enough open/completed volume"
        : `${snapshot.metrics.completionRate}% (completed / completed + still-open)`
    }`,
    10
  );

  const renderBreakdown = (title: string, items: typeof snapshot.metrics.byCategory) => {
    y -= 4;
    draw(title, 11, true);
    if (items.length === 0) {
      draw("No data for this period", 9, false, rgb(0.45, 0.5, 0.55));
      return;
    }
    for (const item of items.slice(0, 12)) {
      draw(`  ${item.label}: ${item.count}`, 9);
    }
  };

  renderBreakdown("By category", snapshot.metrics.byCategory);
  renderBreakdown("By priority", snapshot.metrics.byPriority);
  renderBreakdown("By vendor", snapshot.metrics.byVendor);

  y -= 8;
  draw("Work orders", 12, true);
  const tableRows = snapshot.rows.slice(0, WORK_ORDER_REPORT_PDF_ROW_CAP);
  if (tableRows.length === 0) {
    draw("No work orders match these filters.", 10, false, rgb(0.45, 0.5, 0.55));
  } else {
    for (const row of tableRows) {
      ensure(36);
      draw(`${row.workOrderId.slice(0, 8)}… · ${row.status} · ${row.priority}`, 9, true);
      draw(
        `${row.createdDate.slice(0, 10)} · ${row.location} · ${row.category}`,
        8,
        false,
        rgb(0.3, 0.35, 0.4)
      );
      const assignee = [row.assignedVendor, row.assignedUser].filter(Boolean).join(" / ") || "Unassigned";
      draw(
        `Assignee: ${assignee}${row.completedDate ? ` · Completed ${row.completedDate.slice(0, 10)}` : ""}`,
        8,
        false,
        rgb(0.35, 0.4, 0.45)
      );
    }
  }

  if (snapshot.rows.length > WORK_ORDER_REPORT_PDF_ROW_CAP) {
    y -= 4;
    draw(
      `${snapshot.rows.length - WORK_ORDER_REPORT_PDF_ROW_CAP} additional rows — see CSV export.`,
      9,
      false,
      rgb(0.45, 0.5, 0.55)
    );
  }

  if (snapshot.truncated) {
    draw(
      `CSV row cap reached (${snapshot.rows.length}). Narrow filters for a complete extract.`,
      9,
      false,
      rgb(0.55, 0.35, 0.2)
    );
  }

  footer();

  const bytes = await pdf.save();
  const safe = snapshot.organizationSlug || "organization";
  return {
    bytes,
    fileName: `${safe}_work-orders_${snapshot.surface}_${snapshot.filters.dateFrom}_${snapshot.filters.dateTo}.pdf`
  };
}

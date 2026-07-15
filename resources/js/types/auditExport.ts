/**
 * A requested export of one of a workspace's append-only logs, as shown on the
 * team Exports page. Generated from the `App\Data\AuditExportData` DTO.
 * `isReady` is true only while the file is built and still inside its download
 * window; `isExpired` distinguishes a lapsed download from a failed build.
 */
export type AuditExport = App.Data.AuditExportData;

/**
 * A selectable option (log type or file format) for the export request form.
 */
export type AuditExportOption = {
    value: string;
    label: string;
};

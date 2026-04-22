export function StaleReportBanner() {
  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 no-print">
      <p className="font-heading text-label text-warning">הדוח לא מעודכן</p>
      <p className="mt-1 text-small text-foreground">
        הדוח לא מעודכן לפי התשובות האחרונות. אפשר להפיק דוח חדש בלחיצה אחת.
      </p>
    </div>
  );
}

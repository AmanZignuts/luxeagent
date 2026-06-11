"use client";

export function OrderStatusComponent({
  orders,
}: {
  orders: {
    id: string;
    status: string;
    total: number;
    itemCount: number;
    createdAt: string;
    trackingNumber?: string;
  }[];
}) {
  return (
    <div className="w-full max-w-sm bg-surface-white border border-muted-zinc rounded-xl p-4 font-sans space-y-3">
      <div>
        <span className="text-[8px] font-bold tracking-widest text-obsidian-velvet/40 uppercase block">
          Client Purchase History
        </span>
        <h3 className="font-serif text-sm font-semibold text-obsidian-velvet mt-1">
          Recent Staged Orders
        </h3>
      </div>

      <div className="space-y-2.5">
        {orders.length === 0 ? (
          <p className="text-[10px] text-obsidian-velvet/60 italic py-2">
            No recent purchase history registered under this identity code.
          </p>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="border border-muted-zinc/60 rounded-lg p-3 bg-warm-linen/10 space-y-1.5"
            >
              <div className="flex justify-between items-center text-[8px] font-sans font-bold">
                <span className="text-obsidian-velvet/50 truncate max-w-[60%]">
                  ID: {o.id.substring(0, 13).toUpperCase()}...
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-sm uppercase tracking-wider text-[7px] ${
                    o.status === "CONFIRMED" || o.status === "DELIVERED"
                      ? "bg-emerald-50 border border-emerald-300 text-emerald-700"
                      : "bg-amber-50 border border-amber-300 text-amber-700"
                  }`}
                >
                  {o.status}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold text-obsidian-velvet">
                <span>{o.itemCount} Curation Items</span>
                <span>${o.total}</span>
              </div>

              {o.trackingNumber && (
                <div className="pt-1.5 border-t border-muted-zinc/20 flex justify-between items-center text-[7.5px] font-bold tracking-wide text-obsidian-velvet/50">
                  <span>TRACKING CODE:</span>
                  <span className="text-obsidian-velvet">{o.trackingNumber}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React from 'react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the admin panel.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
          <p className="mt-2 text-3xl font-bold">--</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Verified Users</h3>
          <p className="mt-2 text-3xl font-bold">--</p>
        </div>
      </div>
    </div>
  )
}

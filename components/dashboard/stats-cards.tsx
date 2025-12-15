"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, DollarSign } from "lucide-react"

interface StatsCardsProps {
  totalClients: number
  totalBookings: number
  pendingPayments: number
}

export function StatsCards({ totalClients, totalBookings, pendingPayments }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Clients",
      value: totalClients,
      icon: Users,
      description: "Active clients",
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: Calendar,
      description: "All bookings",
    },
    {
      title: "Pending Payments",
      value: `$${pendingPayments.toLocaleString()}`,
      icon: DollarSign,
      description: "Outstanding amount",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  totalClients: number
  totalBookings: number
  pendingPayments: number
  totalRevenue?: number
  projectedRevenue?: number
  overdueRevenue?: number
}

export function StatsCards({ totalClients, totalBookings, pendingPayments, totalRevenue = 0, projectedRevenue = 0, overdueRevenue = 0 }: StatsCardsProps) {
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
      value: `$${pendingPayments.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      description: "Outstanding amount",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      description: "All time",
    },
    {
      title: "Projected Revenue",
      value: `$${projectedRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: TrendingUp,
      description: "Next 30 days",
    },
  ]

  // Add overdue revenue card if there's overdue revenue
  if (overdueRevenue > 0) {
    stats.push({
      title: "Overdue Revenue",
      value: `$${overdueRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      description: "Past events",
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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




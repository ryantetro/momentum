import { BookingForm } from "@/components/bookings/booking-form"

export default function NewBookingPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Booking</h1>
        <p className="text-muted-foreground">
          Create a new booking for this client
        </p>
      </div>
      <BookingForm clientId={params.id} />
    </div>
  )
}


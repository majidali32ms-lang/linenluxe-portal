// LinenLuxe brand logo (real lockup). `size` is the rendered height in px.
export default function Logo({ size = 48, className = '' }) {
  return (
    <img
      src="/brand/linenluxe-logo.png"
      alt="LinenLuxe Laundry"
      style={{ height: size, width: 'auto' }}
      className={className}
      draggable="false"
    />
  )
}

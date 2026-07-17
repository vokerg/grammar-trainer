export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error-message" role="alert">
      <strong>Vi kunne ikke gennemføre det.</strong>
      <span>{message}</span>
    </div>
  );
}

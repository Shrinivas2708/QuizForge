import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground mb-4">
            Oops! The page you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/">Go back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
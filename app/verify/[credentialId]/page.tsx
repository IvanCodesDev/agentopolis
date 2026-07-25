import { VerifyExperience } from "@/components/credentials/verify-experience";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}) {
  const { credentialId } = await params;
  return <VerifyExperience credentialId={credentialId} />;
}

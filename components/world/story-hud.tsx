import type { StoryStage } from "@/lib/demo/types";
import type { WorldLocationId } from "@/lib/world/types";

const guides: Record<StoryStage, { title: string; objective: string }> = {
  INTRO: {
    title: "Prologue: invisible work",
    objective: "Go to the designer home and start the career quest.",
  },
  TASK_CREATED: {
    title: "Chapter 1: private brief",
    objective: "Switch to Guild and send an anonymous quest invite.",
  },
  DESIGNER_INVITED: {
    title: "Chapter 2: accept quest",
    objective: "Switch to Designer and accept the anonymous commission.",
  },
  QUEST_ACCEPTED: {
    title: "Chapter 3: submit V1",
    objective: "Use the workshop to submit the first design version.",
  },
  V1_SUBMITTED: {
    title: "Chapter 4: review feedback",
    objective: "Switch to Guild and request a focused revision.",
  },
  REVISION_REQUESTED: {
    title: "Chapter 5: submit V2",
    objective: "Read feedback, then submit the revised version.",
  },
  V2_SUBMITTED: {
    title: "Chapter 6: final review",
    objective: "Switch to Guild and approve V2.",
  },
  WORK_APPROVED: {
    title: "Chapter 7: issue credential",
    objective: "Issue a local Monad-style contribution credential.",
  },
  ATTESTING: {
    title: "Attesting",
    objective: "Waiting for the local demo adapter.",
  },
  CREDENTIAL_ISSUED: {
    title: "Chapter 8: passport",
    objective: "Switch to Designer and add the credential to the passport.",
  },
  PORTFOLIO_SHARED: {
    title: "Chapter 9: HR verify",
    objective: "Switch to HR and verify the public credential.",
  },
  HR_VERIFIED: {
    title: "Finale: visible proof",
    objective: "The full MVP flow is complete.",
  },
  CREDENTIAL_REVOKED: {
    title: "Revoked",
    objective: "The credential history is retained for the demo.",
  },
};

export function StoryHud({
  stage,
  nearestLocation,
  onInteract,
}: {
  stage: StoryStage;
  nearestLocation: WorldLocationId | null;
  onInteract: () => void;
}) {
  const guide = guides[stage];

  return (
    <section aria-label="Story objective" className="sceneHud storyHud">
      <strong>{guide.title}</strong>
      <p>{guide.objective}</p>
      {nearestLocation ? (
        <button onClick={onInteract} type="button">
          Press E: {nearestLocation}
        </button>
      ) : (
        <small>Move with WASD or arrow keys. Stand near a glowing place.</small>
      )}
    </section>
  );
}

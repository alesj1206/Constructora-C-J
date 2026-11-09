/** A work front / activity inside a project (HU-02). */
export interface WorkFront {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly name: string;
}

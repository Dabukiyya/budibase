import { z } from "zod"
import { ViewV2 } from "../../../documents"
import { ViewV2Enriched } from "../../../sdk/view"

export interface ViewResponse {
  data: ViewV2
}

export interface ViewResponseEnriched {
  data: ViewV2Enriched
}

// export interface CreateViewRequest extends Omit<ViewV2, "version" | "id"> {}

const viewSchema = z.record(
  z.string(),
  z.object({
    columns: z.record(
      z.string(),
      z.object({
        visible: z.boolean(),
        readonly: z.optional(z.boolean()),
        order: z.optional(z.number()),
        width: z.optional(z.number()),
        icon: z.optional(z.string()),
      })
    ),
  })
)

const view = z.object({
  name: z.string(),
  tableId: z.string(),
  primaryDisplay: z.optional(z.string()),
  query: z.any(),
  sort: z.any(),
  schema: z.optional(viewSchema),
})

export const validateCreateViewRequest = view

export type CreateViewRequest = z.infer<typeof view>

export interface UpdateViewRequest extends ViewV2 {}

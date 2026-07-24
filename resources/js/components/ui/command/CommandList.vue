<script setup lang="ts">
import type { ListboxContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ListboxContent, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<ListboxContentProps & {
  class?: HTMLAttributes["class"]
  /**
   * Accessible name for the rendered `role="listbox"` element, required at the
   * type level: an unnamed ARIA input field is a serious axe violation
   * (`aria-input-field-name`, #798), so every call site must say what its list
   * contains rather than rely on remembering to pass a loose attribute.
   */
  ariaLabel: string
}>()

const delegatedProps = reactiveOmit(props, "class", "ariaLabel")

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ListboxContent
    data-slot="command-list"
    v-bind="forwarded"
    :aria-label="props.ariaLabel"
    :class="cn('max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto', props.class)"
  >
    <div role="presentation">
      <slot />
    </div>
  </ListboxContent>
</template>

import * as core from '@actions/core'
import globby from 'globby'
import { readFile } from 'fs/promises'

export async function run(): Promise<void> {
  try {
    const projectJsonFiles = await globby('**/project.json')

    const target = core.getInput('target')

    core.debug(
      `Found ${projectJsonFiles.length} project.json files which will be searched for a target named ${target}`
    )

    const allTargetOutputs = await Promise.all(
      projectJsonFiles.map(async projectJson => {
        core.debug(`Reading ${projectJson}`)
        const rawContents = await readFile(projectJson, 'utf-8')
        const json = JSON.parse(rawContents)
        core.debug(`JSON for ${projectJson}: ${JSON.stringify(json)}`)
        const targetOutputs = json?.targets?.[target]?.outputs

        if (targetOutputs) {
          core.debug(
            `Outputs for ${target} found in file ${projectJson}: ${targetOutputs}`
          )
        }

        return (targetOutputs ?? []) as string[]
      })
    )

    const paths = allTargetOutputs
      .flat()
      .map(p => p.replace('{workspaceRoot}/', ''))
      .join('\n')

    core.debug(`OUTPUT PATHS: ${paths}`)

    core.setOutput('paths', paths)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

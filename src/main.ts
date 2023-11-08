import * as core from '@actions/core'
import globby from 'globby'
import { readFile } from 'fs/promises'

export async function run(): Promise<void> {
  try {
    const projectJsonFiles = await globby('**/project.json')

    const target = core.getInput('target')

    const codegenOutputs = await Promise.all(
      projectJsonFiles.map(async projectJson => {
        const rawContents = await readFile(projectJson, 'utf-8')
        const json = JSON.parse(rawContents)
        const codegenOutputs = json?.targets?.[target]?.outputs

        return (codegenOutputs ?? []) as string[]
      })
    )

    const paths = codegenOutputs
      .flat()
      .map(p => p.replace('{workspaceRoot}/', ''))
      .join('\n')

    core.setOutput('paths', paths)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

import {
  ASTVisitor,
  GraphQLError,
  ValidationContext,
} from 'graphql';

export function createDepthLimitRule(maxDepth: number) {
  return function depthLimitRule(context: ValidationContext): ASTVisitor {
    let depth = 0;

    return {
      Field: {
        enter(node) {
          if (node.name.value.startsWith('__')) {
            return;
          }

          depth += 1;
          if (depth > maxDepth) {
            context.reportError(
              new GraphQLError(
                `Query depth limit exceeded. Maximum depth is ${maxDepth}.`,
                { nodes: [node] },
              ),
            );
          }
        },
        leave(node) {
          if (node.name.value.startsWith('__')) {
            return;
          }
          depth -= 1;
        },
      },
    };
  };
}

export function createComplexityLimitRule(maxComplexity: number) {
  return function complexityLimitRule(context: ValidationContext): ASTVisitor {
    let complexity = 0;

    return {
      Field(node) {
        if (node.name.value.startsWith('__')) {
          return;
        }

        complexity += 1;
        if (complexity > maxComplexity) {
          context.reportError(
            new GraphQLError(
              `Query complexity limit exceeded. Maximum complexity is ${maxComplexity}.`,
              { nodes: [node] },
            ),
          );
        }
      },
    };
  };
}

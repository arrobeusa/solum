<?php

namespace LinkShare\Bundle\SolumBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Finder\Finder;

use Symfony\Component\Console\Input\InputArgument,
    Symfony\Component\Console\Input\InputOption,
    Symfony\Component\Console;

use Symfony\Component\Console\Formatter\OutputFormatterStyle;

use Symfony\Component\Yaml\Parser;
use Symfony\Component\Yaml\Dumper;

/* TODO:
*/

class RunMochaJSCoverageReportCommand extends ContainerAwareCommand
{
    /**
     *
     */
    protected function configure()
    {
        parent::configure();

        $this
            ->setName('solum:test:mocha:coverage')
            ->setDescription(
                'Runs jscoverage on the specified library,' .
                ' places it in the specified directory,' .
                ' and runs the unit tests to make sure they pass,' .
                ' then runs the coverage report.'
              )
            ->addArgument(
                'lib-directory',
                InputArgument::REQUIRED,
                'The source for the javascript files to be tested.'
              )
            ->addArgument(
                'instrumented-directory',
                InputArgument::REQUIRED,
                'After JSCoverage runs, it will place instrumented JS files here.' .
                ' Your test files should know how to access these files.'
              );
    }

    /**
     *
     * @param \Symfony\Component\Console\Input\InputInterface $input
     * @param \Symfony\Component\Console\Output\OutputInterface $output
     */
    protected function execute(Console\Input\InputInterface $input, Console\Output\OutputInterface $output)
    {
        $libDir  = $input->getArgument('lib-directory');
        $instDir = $input->getArgument('instrumented-directory');

        $output   = array();
        $lastLine = exec("mocha $libDir* -R min", &$output, $status);
        $output->writeln($status);
        print_r($output);
    }
}

